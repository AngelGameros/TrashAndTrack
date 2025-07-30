"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, Linking, Alert, Dimensions, TouchableOpacity, StatusBar } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { MaterialIcons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

export default function ScanScreen() {
  const [scannedData, setScannedData] = useState(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [cameraType, setCameraType] = useState("back")
  const [cameraKey, setCameraKey] = useState(0)

  useEffect(() => {
    if (!permission) return
    if (!permission.granted) {
      requestPermission()
    }
  }, [permission])

  const handleBarCodeScanned = ({ type, data }) => {
    if (scannedData) return

    setScannedData(data)
    console.log(`Tipo de código: ${type}`)
    console.log(`Datos escaneados: ${data}`)

    Alert.alert(
      "Código QR Escaneado",
      `Contenido: ${data}`,
      [
        {
          text: "Escanear Otro",
          onPress: () => setScannedData(null),
          style: "default",
        },
        {
          text: "Cerrar",
          style: "cancel",
        },
      ],
      { cancelable: false },
    )

    if (data.startsWith("http://") || data.startsWith("https://")) {
      Linking.openURL(data).catch((err) => console.error("No se pudo abrir la URL", err))
    }
  }

  const restartCamera = () => {
    setScannedData(null)
    setCameraKey((prev) => prev + 1)
  }

  if (!permission) return null

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
        <LinearGradient colors={["#4A90E2", "#357ABD"]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <MaterialIcons name="camera-alt" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.permissionTitle}>Acceso a Cámara Requerido</Text>
          <Text style={styles.permissionText}>
            Para escanear códigos QR necesitamos acceso a tu cámara. Por favor, concede los permisos necesarios.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder Permisos</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <LinearGradient colors={["rgba(74, 144, 226, 0.9)", "rgba(53, 122, 189, 0.9)"]} style={styles.header}>
        <MaterialIcons name="qr-code-scanner" size={32} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Escáner QR</Text>
        <Text style={styles.headerSubtitle}>Apunta la cámara hacia el código QR</Text>
      </LinearGradient>

      {/* Camera */}
      <CameraView
        key={cameraKey}
        onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        facing={cameraType}
        style={styles.camera}
      >
        <View style={styles.overlay}>
          {/* Scanning Frame */}
          <View style={styles.scanningArea}>
            <View style={styles.scanFrame}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Scanning line animation */}
              <View style={styles.scanLine} />
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>Coloca el código QR dentro del marco</Text>
          </View>
        </View>
      </CameraView>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={restartCamera}>
          <MaterialIcons name="refresh" size={24} color="#4A90E2" />
          <Text style={styles.controlButtonText}>Reiniciar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setCameraType(cameraType === "back" ? "front" : "back")}
        >
          <MaterialIcons name="flip-camera-ios" size={24} color="#4A90E2" />
          <Text style={styles.controlButtonText}>Voltear</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    padding: 40,
    maxWidth: 320,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    color: "#4A90E2",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 120, // Account for header
  },
  scanFrame: {
    width: width * 0.7,
    height: width * 0.7,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#4A90E2",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#4A90E2",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionsContainer: {
    position: "absolute",
    bottom: 200,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  instructionsText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 30,
    paddingHorizontal: 40,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 80,
  },
  controlButtonText: {
    color: "#4A90E2",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
})
