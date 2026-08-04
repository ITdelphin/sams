"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import {
    CheckCircle2,
    Camera,
    Fingerprint,
    CreditCard,
    Loader2,
    AlertCircle,
    ScanLine,
    Shield,
    ArrowRight,
    X,
} from "lucide-react";

type EnrollStatus = "idle" | "loading" | "capturing" | "processing" | "enrolled" | "error";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights";

export default function BiometricsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState("Student");
    const [activeTab, setActiveTab] = useState<"face" | "fingerprint" | "card" | null>(null);

    // Enrollment statuses
    const [faceStatus, setFaceStatus] = useState<EnrollStatus>("idle");
    const [fingerStatus, setFingerStatus] = useState<EnrollStatus>("idle");
    const [cardStatus, setCardStatus] = useState<EnrollStatus>("idle");

    // Face refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceapiRef = useRef<unknown>(null);
    const faceModelsLoaded = useRef(false);
    const [facePreviewActive, setFacePreviewActive] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Card state
    const [cardInput, setCardInput] = useState("");
    const [scannerRunning, setScannerRunning] = useState(false);
    const scannerRef = useRef<unknown>(null);

    // Load existing enrollments on mount
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.push("/register"); return; }
            setUserId(data.user.id);
            setUserName(data.user.user_metadata?.full_name?.split(" ")[0] ?? "Student");
            checkExistingEnrollments(data.user.id);
        });
    }, [router]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopWebcam();
            stopCardScanner();
        };
    }, []);

    async function checkExistingEnrollments(uid: string) {
        const supabase = createClient();
        const { data } = await supabase
            .from("biometric_enrollments")
            .select("type")
            .eq("student_id", uid)
            .eq("is_active", true);
        if (data) {
            data.forEach((e: { type: string }) => {
                if (e.type === "face") setFaceStatus("enrolled");
                if (e.type === "fingerprint") setFingerStatus("enrolled");
                if (e.type === "id_card") setCardStatus("enrolled");
            });
        }
    }

    // ─── Face ─────────────────────────────────────────────────

    async function loadFaceAPI() {
        if (faceModelsLoaded.current) return faceapiRef.current;
        setFaceStatus("loading");
        try {
            const faceapi = await import("face-api.js");
            await Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (faceapi as any).nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (faceapi as any).nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (faceapi as any).nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            faceapiRef.current = faceapi;
            faceModelsLoaded.current = true;
            return faceapi;
        } catch {
            setFaceStatus("error");
            toast.error("Could not load face recognition models. Check your internet connection.");
            return null;
        }
    }

    async function startWebcam(): Promise<boolean> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await new Promise<void>((res) => { videoRef.current!.onloadedmetadata = () => res(); });
                videoRef.current.play();
            }
            return true;
        } catch {
            toast.error("Camera access denied. Please allow camera access in your browser.");
            return false;
        }
    }

    function stopWebcam() {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setFacePreviewActive(false);
        setFaceDetected(false);
    }

    async function startFaceEnrollment() {
        if (activeTab === "face" && facePreviewActive) {
            stopWebcam();
            setActiveTab(null);
            if (faceStatus !== "enrolled") setFaceStatus("idle");
            return;
        }
        stopCardScanner();
        setActiveTab("face");

        const faceapi = await loadFaceAPI();
        if (!faceapi) return;

        const ok = await startWebcam();
        if (!ok) { setFaceStatus("error"); return; }

        setFaceStatus("capturing");
        setFacePreviewActive(true);

        // Live face detection preview
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fa = faceapi as any;
        detectionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            try {
                const det = await fa.detectSingleFace(
                    videoRef.current,
                    new fa.TinyFaceDetectorOptions()
                );
                setFaceDetected(!!det);
            } catch { /* ignore */ }
        }, 500);
    }

    async function captureFace() {
        if (!videoRef.current || !faceapiRef.current) return;
        setFaceStatus("processing");
        if (detectionIntervalRef.current) { clearInterval(detectionIntervalRef.current); detectionIntervalRef.current = null; }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fa = faceapiRef.current as any;
        try {
            const detection = await fa
                .detectSingleFace(videoRef.current, new fa.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.error("No face detected. Look directly at the camera in good lighting.");
                setFaceStatus("capturing");
                // Restart detection
                detectionIntervalRef.current = setInterval(async () => {
                    if (!videoRef.current) return;
                    const det = await fa.detectSingleFace(videoRef.current, new fa.TinyFaceDetectorOptions()).catch(() => null);
                    setFaceDetected(!!det);
                }, 500);
                return;
            }

            const descriptor = Array.from(detection.descriptor) as number[];
            if (!userId) { toast.error("Not authenticated."); return; }
            const supabase = createClient();
            const { error } = await supabase.from("biometric_enrollments").upsert(
                { student_id: userId, type: "face", face_descriptor: descriptor, is_active: true },
                { onConflict: "student_id,type" }
            );

            if (error) throw error;

            stopWebcam();
            setFaceStatus("enrolled");
            toast.success("✅ Face enrolled! You can now use face recognition for attendance.");
        } catch (err) {
            console.error(err);
            toast.error("Face capture failed. Please try again.");
            setFaceStatus("capturing");
            detectionIntervalRef.current = setInterval(async () => {
                if (!videoRef.current) return;
                const det = await fa.detectSingleFace(videoRef.current, new fa.TinyFaceDetectorOptions()).catch(() => null);
                setFaceDetected(!!det);
            }, 500);
        }
    }

    function retryFace() {
        stopWebcam();
        setFaceStatus("idle");
        setActiveTab(null);
    }

    // ─── Fingerprint (WebAuthn) ───────────────────────────────

    async function enrollFingerprint() {
        stopWebcam();
        stopCardScanner();
        setActiveTab("fingerprint");
        setFingerStatus("loading");

        if (!window.PublicKeyCredential) {
            toast.error("Your browser doesn't support WebAuthn authentication.");
            setFingerStatus("error");
            return;
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            if (!available) {
                toast.error("No fingerprint / face sensor detected on this device. Try another device.");
                setFingerStatus("error");
                return;
            }

            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            const userIdBytes = new TextEncoder().encode(userId ?? "unknown");

            const credential = (await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "SAMS – Smart Attendance", id: window.location.hostname },
                    user: { id: userIdBytes, name: userId ?? "student", displayName: userName },
                    pubKeyCredParams: [
                        { type: "public-key", alg: -7 },
                        { type: "public-key", alg: -257 },
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required",
                        residentKey: "preferred",
                    },
                    timeout: 60000,
                },
            })) as PublicKeyCredential | null;

            if (!credential) throw new Error("No credential returned");

            const response = credential.response as AuthenticatorAttestationResponse;
            const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
            const rawPublicKey = response.getPublicKey ? response.getPublicKey() : null;
            const pubKey = rawPublicKey
                ? btoa(String.fromCharCode(...new Uint8Array(rawPublicKey)))
                : "";

            const supabase = createClient();
            if (!userId) { toast.error("Not authenticated."); return; }
            const { error } = await supabase.from("biometric_enrollments").upsert(
                {
                    student_id: userId,
                    type: "fingerprint",
                    webauthn_credential_id: credId,
                    webauthn_public_key: pubKey,
                    device_info: `${navigator.platform} – ${navigator.userAgent.slice(0, 80)}`,
                    is_active: true,
                },
                { onConflict: "student_id,type" }
            );

            if (error) throw error;

            setFingerStatus("enrolled");
            toast.success("✅ Fingerprint enrolled! You can now use biometrics for attendance.");
        } catch (err: unknown) {
            const name = (err as { name?: string })?.name;
            if (name === "NotAllowedError") {
                toast.error("Fingerprint enrollment was cancelled or denied.");
            } else if (name === "InvalidStateError") {
                toast.error("This device is already registered. Re-enrolling…");
            } else {
                toast.error("Fingerprint enrollment failed. Make sure your device has a biometric sensor.");
            }
            setFingerStatus("idle");
            setActiveTab(null);
        }
    }

    // ─── ID Card Scanner ─────────────────────────────────────

    async function startCardScanner() {
        stopWebcam();
        setActiveTab("card");
        setScannerRunning(true);

        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const scanner = new Html5Qrcode("qr-reader-div");
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 260, height: 160 } },
                async (decodedText: string) => {
                    await stopCardScanner();
                    setCardInput(decodedText);
                    await saveCardBarcode(decodedText);
                },
                () => { /* ignore decode errors */ }
            );
        } catch {
            toast.error("Camera access required to scan your card. Use manual entry below.");
            setScannerRunning(false);
        }
    }

    const stopCardScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (scannerRef.current as any).stop();
            } catch { /* ignore */ }
            scannerRef.current = null;
        }
        setScannerRunning(false);
    }, []);

    async function saveCardBarcode(barcode: string) {
        const trimmed = barcode.trim();
        if (!trimmed) { toast.error("Card number cannot be empty."); return; }
        if (!userId) { toast.error("Not authenticated."); return; }
        setCardStatus("processing");
        const supabase = createClient();
        const { error } = await supabase.from("biometric_enrollments").upsert(
            { student_id: userId, type: "id_card", card_barcode: trimmed, is_active: true },
            { onConflict: "student_id,type" }
        );
        if (error) {
            toast.error("Failed to save card. Please try again.");
            setCardStatus("idle");
        } else {
            setCardStatus("enrolled");
            toast.success("✅ ID Card enrolled! You can now swipe your card for attendance.");
        }
    }

    // ─── Completion ───────────────────────────────────────────

    const enrolledCount = [faceStatus, fingerStatus, cardStatus].filter((s) => s === "enrolled").length;

    function handleComplete() {
        stopWebcam();
        stopCardScanner();
        if (enrolledCount > 0) {
            toast.success(`Setup complete! ${enrolledCount} biometric method${enrolledCount !== 1 ? "s" : ""} registered.`);
        }
        router.push("/student");
    }

    // ─── Status helpers ───────────────────────────────────────

    function statusBadge(status: EnrollStatus) {
        if (status === "enrolled")
            return <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"><CheckCircle2 className="size-3.5" /> Enrolled</span>;
        if (status === "loading")
            return <span className="flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700"><Loader2 className="size-3.5 animate-spin" /> Loading…</span>;
        if (status === "processing")
            return <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"><Loader2 className="size-3.5 animate-spin" /> Processing…</span>;
        if (status === "error")
            return <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700"><AlertCircle className="size-3.5" /> Unavailable</span>;
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">Not enrolled</span>;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#050d1a] via-[#0a1628] to-[#0d1f3c] px-4 py-12">
            {/* Background glows */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/3 size-[500px] rounded-full bg-sky-600/10 blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 size-80 rounded-full bg-violet-600/10 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-lg">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 text-base font-black text-white shadow-lg shadow-sky-500/30">
                        SA
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Secure Your Account</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Hi {userName}! Register your biometrics for instant, fraud-proof attendance.
                        <br />
                        <span className="text-sky-400">All steps are optional</span> — you can add or change them any time from your profile.
                    </p>

                    {/* Progress pills */}
                    <div className="mt-5 flex items-center justify-center gap-2">
                        {["Face", "Fingerprint", "ID Card"].map((label, i) => {
                            const statuses = [faceStatus, fingerStatus, cardStatus];
                            const isEnrolled = statuses[i] === "enrolled";
                            return (
                                <div key={label} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${isEnrolled ? "bg-sky-500 text-white" : "bg-white/5 text-slate-500"}`}>
                                    {isEnrolled && <CheckCircle2 className="size-3" />}
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ─── Face Card ─── */}
                <div className={`mb-4 overflow-hidden rounded-2xl border transition-all duration-300 ${activeTab === "face" ? "border-sky-500/50 bg-white/5" : "border-white/5 bg-white/[0.03]"}`}>
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${faceStatus === "enrolled" ? "bg-green-500/20" : "bg-sky-500/10"}`}>
                                <Camera className={`size-6 ${faceStatus === "enrolled" ? "text-green-400" : "text-sky-400"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Face Recognition</p>
                                <p className="text-xs text-slate-400">Webcam photo for AI identity verification</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {statusBadge(faceStatus)}
                            {faceStatus !== "enrolled" && faceStatus !== "processing" && (
                                <button
                                    onClick={startFaceEnrollment}
                                    className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors"
                                >
                                    {activeTab === "face" && facePreviewActive ? "Cancel" : "Enroll →"}
                                </button>
                            )}
                            {faceStatus === "enrolled" && (
                                <button onClick={retryFace} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">
                                    Re-enroll
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Face webcam panel */}
                    {activeTab === "face" && faceStatus !== "enrolled" && (
                        <div className="border-t border-white/5 p-5">
                            <div className="relative overflow-hidden rounded-xl bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="h-56 w-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                                {/* Face detection indicator */}
                                <div className={`absolute inset-0 flex items-center justify-center`}>
                                    <div className={`h-40 w-36 rounded-xl border-2 transition-colors duration-300 ${faceDetected ? "border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "border-white/20"}`} />
                                </div>
                                <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${faceDetected ? "bg-green-500/80 text-white" : "bg-black/60 text-slate-300"}`}>
                                    {faceStatus === "loading" ? "Loading AI models…" : faceDetected ? "✓ Face detected — ready to capture!" : "Position your face in the frame"}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { stopWebcam(); setFaceStatus("idle"); setActiveTab(null); }}
                                    className="rounded-xl border border-white/10 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all"
                                >
                                    <X className="mx-auto size-4" />
                                </button>
                                <button
                                    onClick={captureFace}
                                    disabled={!faceDetected || faceStatus === "processing"}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {faceStatus === "processing" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                                    {faceStatus === "processing" ? "Processing…" : "Capture Face"}
                                </button>
                            </div>
                            <p className="mt-3 text-center text-xs text-slate-500">
                                Make sure your face is well-lit and looking directly at the camera.
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── Fingerprint Card ─── */}
                <div className={`mb-4 overflow-hidden rounded-2xl border transition-all duration-300 ${activeTab === "fingerprint" ? "border-violet-500/50 bg-white/5" : "border-white/5 bg-white/[0.03]"}`}>
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${fingerStatus === "enrolled" ? "bg-green-500/20" : "bg-violet-500/10"}`}>
                                <Fingerprint className={`size-6 ${fingerStatus === "enrolled" ? "text-green-400" : "text-violet-400"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Fingerprint / Device Auth</p>
                                <p className="text-xs text-slate-400">Windows Hello, Touch ID, or device PIN</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {statusBadge(fingerStatus)}
                            {fingerStatus !== "enrolled" && fingerStatus !== "loading" && (
                                <button
                                    onClick={enrollFingerprint}
                                    className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    Enroll →
                                </button>
                            )}
                            {fingerStatus === "enrolled" && (
                                <button onClick={enrollFingerprint} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">
                                    Re-enroll
                                </button>
                            )}
                        </div>
                    </div>

                    {activeTab === "fingerprint" && fingerStatus === "loading" && (
                        <div className="border-t border-white/5 p-6 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                                <Fingerprint className="size-8 animate-pulse text-violet-400" />
                            </div>
                            <p className="text-sm font-medium text-white">Waiting for fingerprint…</p>
                            <p className="mt-1 text-xs text-slate-400">
                                Your device will prompt you to scan your fingerprint, use Face ID, or enter your PIN.
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── ID Card Scanner ─── */}
                <div className={`mb-4 overflow-hidden rounded-2xl border transition-all duration-300 ${activeTab === "card" ? "border-teal-500/50 bg-white/5" : "border-white/5 bg-white/[0.03]"}`}>
                    <div className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all ${cardStatus === "enrolled" ? "bg-green-500/20" : "bg-teal-500/10"}`}>
                                <CreditCard className={`size-6 ${cardStatus === "enrolled" ? "text-green-400" : "text-teal-400"}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Student ID Card</p>
                                <p className="text-xs text-slate-400">Scan your physical ID card barcode/QR</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {statusBadge(cardStatus)}
                            {cardStatus !== "enrolled" && cardStatus !== "processing" && (
                                <button
                                    onClick={() => setActiveTab(activeTab === "card" ? null : "card")}
                                    className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                    Enroll →
                                </button>
                            )}
                            {cardStatus === "enrolled" && (
                                <button onClick={() => { setCardStatus("idle"); setCardInput(""); setActiveTab("card"); }} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">
                                    Re-enroll
                                </button>
                            )}
                        </div>
                    </div>

                    {activeTab === "card" && cardStatus !== "enrolled" && (
                        <div className="border-t border-white/5 p-5">
                            {/* Camera scanner area */}
                            <div id="qr-reader-div" className={`overflow-hidden rounded-xl bg-black ${scannerRunning ? "h-56" : "h-0"}`} />

                            {!scannerRunning ? (
                                <button
                                    onClick={startCardScanner}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 py-3 text-sm font-semibold text-teal-400 transition-all hover:bg-teal-500/20"
                                >
                                    <ScanLine className="size-4" />
                                    Scan Card with Camera
                                </button>
                            ) : (
                                <button
                                    onClick={stopCardScanner}
                                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-slate-400 hover:text-white transition-all"
                                >
                                    <X className="size-4" /> Stop Scanner
                                </button>
                            )}

                            <div className="relative my-4 flex items-center gap-3">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-xs text-slate-500">or enter manually</span>
                                <div className="h-px flex-1 bg-white/10" />
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={cardInput}
                                    onChange={(e) => setCardInput(e.target.value)}
                                    placeholder="e.g. 2024001 or barcode number"
                                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all"
                                />
                                <button
                                    onClick={() => saveCardBarcode(cardInput)}
                                    disabled={!cardInput.trim() || cardStatus === "processing"}
                                    className="rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {cardStatus === "processing" ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Type the number printed on your student ID card, or scan the barcode.
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── Info box ─── */}
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                    <Shield className="mt-0.5 size-4 shrink-0 text-sky-400" />
                    <div className="text-xs text-slate-400">
                        <span className="font-semibold text-sky-300">Your data is secure.</span> Biometric data is encrypted and stored only within your institution&apos;s Supabase database. Face descriptors are mathematical representations, not raw images. They cannot be reverse-engineered.
                    </div>
                </div>

                {/* ─── Action buttons ─── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleComplete}
                        className="rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-medium text-slate-400 backdrop-blur transition-all hover:bg-white/10 hover:text-white"
                    >
                        {enrolledCount === 0 ? "Skip for now" : "Maybe later"}
                    </button>
                    <button
                        onClick={handleComplete}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/50 hover:scale-[1.02]"
                    >
                        {enrolledCount > 0 ? (
                            <>
                                <CheckCircle2 className="size-4" />
                                Complete Setup ({enrolledCount}/3)
                            </>
                        ) : (
                            <>
                                Go to Login
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-slate-600">
                    You can always enroll or update biometrics from{" "}
                    <Link href="/student" className="text-sky-500 hover:underline">your dashboard</Link>{" "}
                    after logging in.
                </p>
            </div>
        </div>
    );
}

// ─── Re-enroll helper (for profile page use) ─────────────────
export function useBiometricReEnroll() {
    const retryFace = useCallback(async (userId: string) => {
        const supabase = createClient();
        await supabase
            .from("biometric_enrollments")
            .update({ is_active: false })
            .eq("student_id", userId)
            .eq("type", "face");
    }, []);

    return { retryFace };
}
