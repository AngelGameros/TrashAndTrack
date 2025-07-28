// src/pages/Login/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/Firebase/firebaseConfig";

const STATUS_PENDING = 0;
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;
const IP_URL = process.env.EXPO_PUBLIC_IP_URL

const API_URL = "http://${IP_URL}:5000/api/usuarios"; // Reemplaza con tu IP y puerto correctos

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveUserToSQLServer = async (userData) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Error al guardar usuario en SQL Server"
        );
      }

      return data;
    } catch (error) {
      console.error("Error al guardar en SQL Server:", error);
      throw error;
    }
  };

  const handleAuthentication = async () => {
    setLoading(true);

    // Validaciones comunes
    if (!email || !password) {
      Alert.alert(
        "Campos Obligatorios",
        "Por favor, ingresa tu correo y contraseña."
      );
      setLoading(false);
      return;
    }

    // Validaciones específicas para registro
    if (isRegistering) {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        Alert.alert(
          "Contraseña Débil",
          "La contraseña debe tener al menos 6 caracteres."
        );
        setLoading(false);
        return;
      }
      if (!nombre || !apellidoPaterno || !apellidoMaterno || !numeroTelefono) {
        Alert.alert(
          "Campos Obligatorios",
          "Por favor, llena todos los campos: Nombre, Apellido Paterno, Apellido Materno y Número de Teléfono."
        );
        setLoading(false);
        return;
      }
      if (!/^\d{10}$/.test(numeroTelefono)) {
        Alert.alert(
          "Número de Teléfono Inválido",
          "El número de teléfono debe contener exactamente 10 dígitos numéricos."
        );
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegistering) {
        // Registro de usuario
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Datos para Firestore
        const firestoreUserData = {
          email: user.email,
          nombre: nombre.trim(),
          apellidoPaterno: apellidoPaterno.trim(),
          apellidoMaterno: apellidoMaterno.trim(),
          numeroTelefono: numeroTelefono.trim(),
          status: STATUS_PENDING,
          accountType: "user",
          createdAt: serverTimestamp(),
        };

        // Datos para SQL Server - NOMBRES DE CAMPOS CORREGIDOS
        const sqlUserData = {
          nombre: nombre.trim(),
          primerApellido: apellidoPaterno.trim(),
          segundoApellido: apellidoMaterno.trim(),
          correo: email.trim(),
          numeroTelefono: numeroTelefono.trim(),
          firebaseUid: user.uid,
          tipoUsuario: "recolector",
        };

        console.log("Enviando a SQL Server:", sqlUserData); // Debug

        // Guardar en ambas bases de datos
        await Promise.all([
          setDoc(doc(db, "usersApproval", user.uid), firestoreUserData),
          saveUserToSQLServer(sqlUserData),
        ]);

        Alert.alert(
          "Registro Exitoso",
          "¡Tu cuenta ha sido creada y está pendiente de aprobación por un administrador. Una vez aprobada, podrás iniciar sesión."
        );

        // Limpiar campos
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setNombre("");
        setApellidoPaterno("");
        setApellidoMaterno("");
        setNumeroTelefono("");
        setIsRegistering(false);
        await signOut(auth);
      } else {
        // Inicio de sesión
        await signInWithEmailAndPassword(auth, email, password);
        setEmail("");
        setPassword("");
      }
    } catch (error) {
      console.error("Error completo:", error);

      let errorMessage = "Ha ocurrido un error. Por favor, inténtalo de nuevo.";

      if (error.message.includes("Network request failed")) {
        errorMessage =
          "No se pudo conectar al servidor. Verifica tu conexión a internet.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Ese correo electrónico ya está en uso.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "El formato del correo electrónico no es válido.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage =
          "Credenciales inválidas. Verifica tu email y contraseña.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Este usuario ha sido deshabilitado.";
      }

      Alert.alert("Error", errorMessage);

      // Intenta eliminar el usuario de Firebase si falló SQL Server
      if (userCredential?.user && error.message.includes("SQL Server")) {
        try {
          await userCredential.user.delete();
          console.log("Usuario eliminado de Firebase por fallo en SQL Server");
        } catch (deleteError) {
          console.error("Error al eliminar usuario:", deleteError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          {isRegistering ? "Regístrate" : "Iniciar Sesión"}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {isRegistering && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido Paterno"
              value={apellidoPaterno}
              onChangeText={setApellidoPaterno}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido Materno"
              value={apellidoMaterno}
              onChangeText={setApellidoMaterno}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="Número de Teléfono (10 dígitos)"
              value={numeroTelefono}
              onChangeText={setNumeroTelefono}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuthentication}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? "Registrarse" : "Iniciar Sesión"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setIsRegistering(!isRegistering);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setNombre("");
            setApellidoPaterno("");
            setApellidoMaterno("");
            setNumeroTelefono("");
          }}
          disabled={loading}
        >
          <Text style={styles.toggleButtonText}>
            {isRegistering
              ? "¿Ya tienes una cuenta? Inicia Sesión"
              : "¿No tienes una cuenta? Regístrate"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F7F7F7",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  input: {
    width: "100%",
    maxWidth: 350,
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    width: "100%",
    maxWidth: 350,
    height: 55,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
  },
  toggleButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
