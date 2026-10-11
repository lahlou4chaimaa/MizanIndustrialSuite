import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    CameraView,
    useCameraPermissions,
} from "expo-camera";
import {
    ArrowLeft,
    Camera,
    ShieldCheck,
    ScanLine,
    QrCode,
    AlertCircle,
    CheckCircle2,
} from "lucide-react-native";

export default function CaameraScanner({
    onScanned,
    onCancel,
}) {
    const [permission, requestPermission] = useCameraPermissions();

    const scannedRef = useRef(false);

    useEffect(() => {
        console.log("[CAMERA] Scanner monté");

        return () => {
            console.log("[CAMERA] Scanner démonté");
            scannedRef.current = false;
        };
    }, []);

    useEffect(() => {
        console.log("[CAMERA] Permission:", permission);

        if (!permission) {
            return;
        }

        if (!permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleBarcodeScanned = ({ data, type }) => {
        if (scannedRef.current) {
            return;
        }

        scannedRef.current = true;

        console.log("[CAMERA] QR détecté");
        console.log("[CAMERA] Type:", type);
        console.log("[CAMERA] Data:", data);

        if (onScanned) {
            onScanned({
                data,
                type,
            });
        }
    };

    /* =========================================================
       LOADING
    ========================================================= */

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingIcon}>
                    <Camera
                        size={28}
                        color={COLORS.primary}
                        strokeWidth={1.8}
                    />
                </View>

                <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                />

                <Text style={styles.loadingTitle}>
                    Initialisation de la caméra
                </Text>

                <Text style={styles.loadingText}>
                    Préparation du scanner MIZAN...
                </Text>
            </View>
        );
    }

    /* =========================================================
       PERMISSION
    ========================================================= */

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionTopBar}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={onCancel}
                        style={styles.backButton}
                    >
                        <ArrowLeft
                            size={21}
                            color={COLORS.white}
                            strokeWidth={2.2}
                        />
                    </TouchableOpacity>

                    <View style={styles.permissionBrand}>
                        <View style={styles.brandIcon}>
                            <QrCode
                                size={16}
                                color={COLORS.white}
                                strokeWidth={2}
                            />
                        </View>

                        <Text style={styles.brandText}>
                            MIZAN
                        </Text>
                    </View>

                    <View style={{ width: 42 }} />
                </View>

                <View style={styles.permissionContent}>
                    <View style={styles.permissionIcon}>
                        <Camera
                            size={42}
                            color={COLORS.primary}
                            strokeWidth={1.7}
                        />

                        <View style={styles.permissionShield}>
                            <ShieldCheck
                                size={19}
                                color={COLORS.success}
                                strokeWidth={2.2}
                            />
                        </View>
                    </View>

                    <Text style={styles.permissionTitle}>
                        Autorisation caméra
                    </Text>

                    <Text style={styles.permissionText}>
                        L'accès à la caméra est nécessaire pour
                        scanner le QR code du ticket de pesée.
                    </Text>

                    <View style={styles.permissionInfo}>
                        <View style={styles.permissionInfoIcon}>
                            <ShieldCheck
                                size={17}
                                color={COLORS.primary}
                                strokeWidth={2}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.permissionInfoTitle}>
                                Accès sécurisé
                            </Text>

                            <Text
                                style={
                                    styles.permissionInfoText
                                }
                            >
                                La caméra est utilisée uniquement
                                pour la lecture du QR code.
                            </Text>
                        </View>
                    </View>

                    {permission.canAskAgain && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.permissionButton}
                            onPress={requestPermission}
                        >
                            <Camera
                                size={19}
                                color={COLORS.white}
                                strokeWidth={2}
                            />

                            <Text
                                style={
                                    styles.permissionButtonText
                                }
                            >
                                AUTORISER LA CAMÉRA
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        activeOpacity={0.75}
                        style={styles.cancelPermissionButton}
                        onPress={onCancel}
                    >
                        <Text
                            style={
                                styles.cancelPermissionButtonText
                            }
                        >
                            Annuler
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.permissionFooter}>
                    <Text style={styles.permissionFooterText}>
                        MIZAN · Gate de pesage
                    </Text>
                </View>
            </View>
        );
    }

    console.log("[CAMERA] Caméra prête");

    /* =========================================================
       CAMERA
    ========================================================= */

    return (
        <View style={styles.container}>
            {/* =================================================
                CAMERA
            ================================================= */}

            <CameraView
                style={styles.camera}
                facing="back"
                active={true}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
            />

            {/* =================================================
                DARK OVERLAY
            ================================================= */}

            <View
                style={styles.overlay}
                pointerEvents="box-none"
            >
                {/* TOP */}
                <View style={styles.topSection}>
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onCancel}
                            style={styles.cameraBackButton}
                        >
                            <ArrowLeft
                                size={20}
                                color={COLORS.white}
                                strokeWidth={2.2}
                            />
                        </TouchableOpacity>

                        <View style={styles.cameraBrand}>
                            <View style={styles.cameraBrandIcon}>
                                <QrCode
                                    size={15}
                                    color={COLORS.white}
                                    strokeWidth={2}
                                />
                            </View>

                            <Text style={styles.cameraBrandText}>
                                MIZAN
                            </Text>
                        </View>

                        <View style={styles.liveBadge}>
                            <View
                                style={
                                    styles.liveBadgeDot
                                }
                            />

                            <Text style={styles.liveBadgeText}>
                                SCAN
                            </Text>
                        </View>
                    </View>

                    <View style={styles.titleContainer}>
                        <View style={styles.titleIcon}>
                            <ScanLine
                                size={18}
                                color={COLORS.white}
                                strokeWidth={2}
                            />
                        </View>

                        <View>
                            <Text style={styles.title}>
                                Scanner le ticket
                            </Text>

                            <Text style={styles.subtitle}>
                                Positionnez le QR code dans le cadre
                            </Text>
                        </View>
                    </View>
                </View>

                {/* CENTER */}
                <View style={styles.middleSection}>
                    <View style={styles.scannerArea}>
                        {/* Cadre */}
                        <View style={styles.scannerFrame}>
                            <View
                                style={[
                                    styles.corner,
                                    styles.topLeft,
                                ]}
                            />

                            <View
                                style={[
                                    styles.corner,
                                    styles.topRight,
                                ]}
                            />

                            <View
                                style={[
                                    styles.corner,
                                    styles.bottomLeft,
                                ]}
                            />

                            <View
                                style={[
                                    styles.corner,
                                    styles.bottomRight,
                                ]}
                            />

                            {/* Ligne de scan */}
                            <View style={styles.scanLine} />

                            {/* Centre */}
                            <View style={styles.centerMarker}>
                                <QrCode
                                    size={25}
                                    color="rgba(255,255,255,0.65)"
                                    strokeWidth={1.5}
                                />
                            </View>
                        </View>

                        <View style={styles.scanHint}>
                            <ScanLine
                                size={15}
                                color={COLORS.white}
                                strokeWidth={2}
                            />

                            <Text style={styles.scanHintText}>
                                QR du ticket de pesée
                            </Text>
                        </View>
                    </View>
                </View>

                {/* BOTTOM */}
                <View style={styles.bottomSection}>
                    <View style={styles.bottomInfo}>
                        <View style={styles.bottomInfoIcon}>
                            <CheckCircle2
                                size={17}
                                color="#7DD3A0"
                                strokeWidth={2}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.bottomInfoTitle}>
                                Scanner prêt
                            </Text>

                            <Text style={styles.bottomInfoText}>
                                Le QR sera détecté automatiquement.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.cancelButton}
                        onPress={onCancel}
                    >
                        <ArrowLeft
                            size={17}
                            color={COLORS.white}
                            strokeWidth={2}
                        />

                        <Text style={styles.cancelButtonText}>
                            ANNULER
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
    navy: "#071827",
    navy2: "#0B1F33",

    primary: "#1769AA",
    primaryLight: "#EAF4FB",

    white: "#FFFFFF",

    text: "#0F172A",
    muted: "#64748B",

    border: "#DCE6EF",

    success: "#15803D",
    successLight: "#EAF7EF",
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
    /* =====================================================
       GENERAL CAMERA
    ===================================================== */

    container: {
        flex: 1,
        backgroundColor: "#000",
    },

    camera: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between",
        alignItems: "center",
    },

    /* =====================================================
       TOP CAMERA
    ===================================================== */

    topSection: {
        width: "100%",
        paddingTop: 22,
        paddingHorizontal: 16,
    },

    topBar: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    cameraBackButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: "rgba(7,24,39,0.72)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

    cameraBrand: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(7,24,39,0.72)",
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
    },

    cameraBrandIcon: {
        width: 25,
        height: 25,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 7,
    },

    cameraBrandText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1.5,
    },

    liveBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(7,24,39,0.72)",
        paddingHorizontal: 9,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
    },

    liveBadgeDot: {
        width: 7,
        height: 7,
        borderRadius: 7,
        backgroundColor: "#7DD3A0",
        marginRight: 5,
    },

    liveBadgeText: {
        color: COLORS.white,
        fontSize: 8,
        fontWeight: "800",
        letterSpacing: 0.8,
    },

    titleContainer: {
        marginTop: 18,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: "rgba(7,24,39,0.72)",
        borderRadius: 16,
        paddingHorizontal: 13,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },

    titleIcon: {
        width: 35,
        height: 35,
        borderRadius: 11,
        backgroundColor: "rgba(23,105,170,0.9)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    title: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "800",
    },

    subtitle: {
        color: "rgba(255,255,255,0.72)",
        fontSize: 10,
        marginTop: 3,
    },

    /* =====================================================
       CENTER SCANNER
    ===================================================== */

    middleSection: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },

    scannerArea: {
        alignItems: "center",
        justifyContent: "center",
    },

    scannerFrame: {
        width: 275,
        height: 275,
        borderRadius: 20,
        position: "relative",
        backgroundColor: "rgba(255,255,255,0.025)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },

    corner: {
        position: "absolute",
        width: 47,
        height: 47,
        borderColor: "#FFFFFF",
    },

    topLeft: {
        top: -1,
        left: -1,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 19,
    },

    topRight: {
        top: -1,
        right: -1,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 19,
    },

    bottomLeft: {
        bottom: -1,
        left: -1,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 19,
    },

    bottomRight: {
        bottom: -1,
        right: -1,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 19,
    },

    scanLine: {
        position: "absolute",
        left: 18,
        right: 18,
        top: "50%",
        height: 2,
        backgroundColor: COLORS.primary,
        opacity: 0.9,
    },

    centerMarker: {
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 48,
        height: 48,
        marginLeft: -24,
        marginTop: -24,
        borderRadius: 14,
        backgroundColor: "rgba(7,24,39,0.48)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },

    scanHint: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        paddingHorizontal: 13,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(7,24,39,0.72)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
    },

    scanHintText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "700",
        marginLeft: 6,
    },

    /* =====================================================
       BOTTOM CAMERA
    ===================================================== */

    bottomSection: {
        width: "100%",
        paddingHorizontal: 16,
        paddingBottom: 24,
    },

    bottomInfo: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(7,24,39,0.78)",
        borderRadius: 15,
        padding: 11,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        marginBottom: 10,
    },

    bottomInfoIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(21,128,61,0.22)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    bottomInfoTitle: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
    },

    bottomInfoText: {
        color: "rgba(255,255,255,0.65)",
        fontSize: 8,
        marginTop: 2,
    },

    cancelButton: {
        height: 48,
        width: "100%",
        borderRadius: 13,
        backgroundColor: "rgba(7,24,39,0.82)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    cancelButtonText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
        marginLeft: 7,
    },

    /* =====================================================
       LOADING
    ===================================================== */

    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.navy,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },

    loadingIcon: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    loadingTitle: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "800",
        marginTop: 15,
    },

    loadingText: {
        color: "#8FA9BD",
        fontSize: 11,
        marginTop: 6,
    },

    /* =====================================================
       PERMISSION
    ===================================================== */

    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.navy,
    },

    permissionTopBar: {
        height: 70,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#17344E",
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: "#17344E",
        borderWidth: 1,
        borderColor: "#29475F",
        alignItems: "center",
        justifyContent: "center",
    },

    permissionBrand: {
        flexDirection: "row",
        alignItems: "center",
    },

    brandIcon: {
        width: 28,
        height: 28,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 7,
    },

    brandText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: 1.5,
    },

    permissionContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 25,
    },

    permissionIcon: {
        width: 92,
        height: 92,
        borderRadius: 28,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        position: "relative",
    },

    permissionShield: {
        position: "absolute",
        right: -5,
        bottom: -4,
        width: 34,
        height: 34,
        borderRadius: 12,
        backgroundColor: COLORS.successLight,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: COLORS.navy,
    },

    permissionTitle: {
        color: COLORS.white,
        fontSize: 21,
        fontWeight: "800",
        textAlign: "center",
    },

    permissionText: {
        color: "#A8BBCB",
        fontSize: 12,
        lineHeight: 19,
        textAlign: "center",
        marginTop: 10,
        maxWidth: 310,
        marginBottom: 22,
    },

    permissionInfo: {
        width: "100%",
        maxWidth: 350,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#102B45",
        borderWidth: 1,
        borderColor: "#21415A",
        borderRadius: 15,
        padding: 12,
        marginBottom: 18,
    },

    permissionInfoIcon: {
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
    },

    permissionInfoTitle: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
    },

    permissionInfoText: {
        color: "#8FA9BD",
        fontSize: 9,
        lineHeight: 14,
        marginTop: 3,
    },

    permissionButton: {
        width: "100%",
        maxWidth: 350,
        height: 50,
        borderRadius: 13,
        backgroundColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    permissionButtonText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.7,
        marginLeft: 8,
    },

    cancelPermissionButton: {
        paddingVertical: 15,
        paddingHorizontal: 25,
    },

    cancelPermissionButtonText: {
        color: "#8FA9BD",
        fontSize: 11,
        fontWeight: "700",
    },

    permissionFooter: {
        alignItems: "center",
        paddingBottom: 22,
    },

    permissionFooterText: {
        color: "#536D82",
        fontSize: 8,
        fontWeight: "700",
        letterSpacing: 0.7,
    },
});