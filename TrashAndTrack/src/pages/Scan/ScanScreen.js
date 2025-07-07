import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScanScreen() {
  const [scannedData, setScannedData] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState('back');
  const [cameraKey, setCameraKey] = useState(0); // clave para forzar remount del CameraView

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scannedData) return;

    setScannedData(data);
    console.log(`Tipo de código: ${type}`);
    console.log(`Datos escaneados: ${data}`);

    Alert.alert(
      "Código QR Escaneado",
      `El contenido se ha registrado en consola.`,
      [{ text: "OK", onPress: () => setScannedData(null) }],
      { cancelable: false }
    );

    if (data.startsWith('http://') || data.startsWith('https://')) {
      Linking.openURL(data).catch(err => console.error("No se pudo abrir la URL", err));
    }
  };

  const restartCamera = () => {
    // cambia la clave para desmontar y volver a montar CameraView
    setCameraKey(prev => prev + 1);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Permiso de cámara no concedido.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/** Título */}
      <Text style={styles.title}>Escanea un Código QR</Text>

      {/** Cámara envuelta con key para reinicio */}
      <CameraView
        key={cameraKey}
        onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        facing={cameraType}
        style={styles.camera}
      >
        <View style={styles.overlay}>
          <View style={styles.frame} />
        </View>
      </CameraView>

      {/** Botón de reinicio */}
      <TouchableOpacity style={styles.restartButton} onPress={restartCamera}>
        <Text style={styles.restartButtonText}>Reiniciar cámara</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    position: 'absolute',
    top: 50,
    fontSize: 22,
    color: 'white',
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    zIndex: 2,
  },
  frame: {
    width: Dimensions.get('window').width * 0.7,
    height: Dimensions.get('window').width * 0.7,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  restartButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffffaa',
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
