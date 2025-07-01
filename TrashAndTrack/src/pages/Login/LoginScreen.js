// src/pages/Login/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView, // Para manejar el teclado
  Platform, // Para determinar el SO (iOS/Android)
  ScrollView // Para permitir scroll si los campos exceden la pantalla
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, // Asegúrate de que signOut esté importado
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Importa serverTimestamp
import { auth, db } from '../../config/Firebase/firebaseConfig';

// Constantes de estado de aprobación (igual que en tus reglas de seguridad y web panel)
const STATUS_PENDING = 0;
const STATUS_APPROVED = 1;
const STATUS_REJECTED = 2;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Para confirmar contraseña en registro
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [numeroTelefono, setNumeroTelefono] = useState('');

  const [isRegistering, setIsRegistering] = useState(false); // Para alternar entre login y registro
  const [loading, setLoading] = useState(false); // Para mostrar indicador de carga

  const handleAuthentication = async () => {
    setLoading(true);

    // --- VALIDACIONES COMUNES A AMBOS MODOS (Login y Registro) ---
    if (!email || !password) {
      Alert.alert('Campos Obligatorios', 'Por favor, ingresa tu correo y contraseña.');
      setLoading(false);
      return;
    }

    // --- VALIDACIONES ESPECÍFICAS PARA EL MODO REGISTRO ---
    if (isRegistering) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        Alert.alert('Contraseña Débil', 'La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      // Validar que todos los campos adicionales estén llenos para el registro
      if (!nombre || !apellidoPaterno || !apellidoMaterno || !numeroTelefono) {
        Alert.alert('Campos Obligatorios', 'Por favor, llena todos los campos: Nombre, Apellido Paterno, Apellido Materno y Número de Teléfono.');
        setLoading(false);
        return;
      }
      // Validar formato de número de teléfono (exactamente 10 dígitos numéricos)
      if (!/^\d{10}$/.test(numeroTelefono)) {
        Alert.alert('Número de Teléfono Inválido', 'El número de teléfono debe contener exactamente 10 dígitos numéricos.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isRegistering) {
        // --- LÓGICA DE REGISTRO DE USUARIO ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guarda la información adicional del usuario, su estado y el tipo de cuenta en Firestore
        await setDoc(doc(db, "usersApproval", user.uid), {
          email: user.email,
          nombre: nombre,
          apellidoPaterno: apellidoPaterno,
          apellidoMaterno: apellidoMaterno,
          numeroTelefono: numeroTelefono,
          status: STATUS_PENDING, // Estado inicial: pendiente de aprobación
          accountType: 'user',    // Tipo de cuenta por defecto para nuevos registros
          createdAt: serverTimestamp(), // Fecha y hora de creación del registro
        });

        Alert.alert(
          'Registro Exitoso',
          '¡Tu cuenta ha sido creada y está pendiente de aprobación por un administrador. Una vez aprobada, podrás iniciar sesión.'
        );
        // Limpiar campos y volver al modo de inicio de sesión
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellidoPaterno('');
        setApellidoMaterno('');
        setNumeroTelefono('');
        setIsRegistering(false); // Vuelve a la pantalla de login para esperar la aprobación
        await signOut(auth); // Cierra la sesión del usuario recién registrado

      } else {
        // --- LÓGICA DE INICIO DE SESIÓN DE USUARIO ---
        await signInWithEmailAndPassword(auth, email, password);
        // La verificación del estado de aprobación y tipo de cuenta se realizará en App.js
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      let errorMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';

      // Mensajes de error específicos de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Ese correo electrónico ya está en uso.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del correo electrónico no es válido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Este usuario ha sido deshabilitado.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false); // Desactivar indicador de carga
    }
  };

  return (
    // KeyboardAvoidingView para manejar el teclado en iOS
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ScrollView para permitir el desplazamiento si hay muchos campos */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{isRegistering ? 'Regístrate' : 'Iniciar Sesión'}</Text>

        {/* Campos de Correo y Contraseña (siempre presentes) */}
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

        {/* Campos adicionales para el registro */}
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
              maxLength={10} // Limita la entrada a 10 dígitos
            />
          </>
        )}

        {/* Botón principal de autenticación (Registrarse o Iniciar Sesión) */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleAuthentication}
          disabled={loading} // Deshabilita el botón mientras se carga
        >
          {loading ? (
            <ActivityIndicator color="#fff" /> // Muestra un indicador de carga
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Botón para alternar entre registro e inicio de sesión */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setIsRegistering(!isRegistering);
            // Limpiar todos los campos al cambiar de modo para evitar confusiones
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setNombre('');
            setApellidoPaterno('');
            setApellidoMaterno('');
            setNumeroTelefono('');
          }}
          disabled={loading} // Deshabilita también el toggle si se está cargando
        >
          <Text style={styles.toggleButtonText}>
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia Sesión'
              : '¿No tienes una cuenta? Regístrate'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F7F7', // <-- Estilo anterior
  },
  title: {
    fontSize: 28, // <-- Estilo anterior
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    maxWidth: 350,
    height: 55, // <-- Estilo anterior
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    width: '100%',
    maxWidth: 350,
    height: 55, // <-- Estilo anterior
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});