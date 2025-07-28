import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { auth, db } from "../../config/Firebase/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No hay usuario autenticado');

      const response = await fetch(`http://${IP_URL}:5000/api/usuarios/firebase/${currentUser.uid}`);
      if (!response.ok) throw new Error('Error al obtener datos del usuario');

      const result = await response.json();
      if (!result?.usuario) throw new Error('La respuesta no contiene datos de usuario');

      setUserData(result.usuario);
      setPhoneNumber(result.usuario.numeroTelefono || '');
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      Alert.alert('Error', 'No se pudo cargar la información del perfil');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, []);

  const handleUpdatePhone = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'El número de teléfono no puede estar vacío');
      return;
    }

    if (phoneNumber === userData.numeroTelefono) {
      Alert.alert('Info', 'No hay cambios que guardar');
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) throw new Error('No hay usuario autenticado');

      const sqlResponse = await fetch(`http://${IP_URL}:5000/api/usuarios/phone`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: currentUser.uid,
          numero_telefono: phoneNumber,
        }),
      });

      if (!sqlResponse.ok) throw new Error('Error al actualizar el número en SQL Server');

      const userDocRef = doc(db, "usersApproval", currentUser.uid);
      await updateDoc(userDocRef, { numeroTelefono: phoneNumber });

      setUserData(prev => ({ ...prev, numeroTelefono: phoneNumber }));
      Alert.alert('Éxito', 'Número de teléfono actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el teléfono:', error);

      let errorMessage = 'No se pudo actualizar el número de teléfono';
      if (error.code === 'not-found') {
        errorMessage = 'Documento de usuario no encontrado';
      } else if (error.message.includes('permission-denied')) {
        errorMessage = 'No tienes permiso para realizar esta acción';
      }

      Alert.alert('Error', errorMessage);
      setPhoneNumber(userData.numeroTelefono || '');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>No se pudo cargar la información del usuario</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4B0082']} />
      }
    >
      <View style={styles.container}>
        {/* Encabezado con foto de perfil */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nombre + ' ' + userData.primerApellido)}&background=4B0082&color=fff` }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.userName}>
            {userData.nombre} {userData.primerApellido} {userData.segundoApellido}
          </Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {userData.tipoUsuario === 'recolector' ? 'Recolector' : 'Administrador'}
            </Text>
          </View>
        </View>

        {/* Información del usuario */}
        <View style={styles.card}>
          {/* Email */}
          <View style={styles.infoItem}>
            <Icon name="email" size={24} color="#6A5ACD" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Correo electrónico</Text>
              <Text style={styles.infoValue}>{userData.correo}</Text>
            </View>
          </View>

          {/* Teléfono */}
          <View style={styles.infoItem}>
            <Icon name="phone" size={24} color="#6A5ACD" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              {isEditing ? (
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="Ingresa tu número"
                />
              ) : (
                <Text style={styles.infoValue}>{phoneNumber || 'No proporcionado'}</Text>
              )}
            </View>
          </View>

          {/* Firebase UID */}
          <View style={styles.infoItem}>
            <Icon name="fingerprint" size={24} color="#6A5ACD" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>ID de usuario</Text>
              <Text style={styles.smallInfoValue}>{userData.firebaseUid}</Text>
            </View>
          </View>
        </View>

        {/* Botones */}
        <View style={styles.actionsContainer}>
          {isUpdating ? (
            <View style={styles.updatingButton}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.buttonText}>ACTUALIZANDO...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={isEditing ? styles.saveButton : styles.editButton}
              onPress={() => isEditing ? handleUpdatePhone() : setIsEditing(true)}
            >
              <Icon name={isEditing ? "save" : "edit"} size={20} color="white" />
              <Text style={styles.buttonText}>
                {isEditing ? 'GUARDAR CAMBIOS' : 'EDITAR TELÉFONO'}
              </Text>
            </TouchableOpacity>
          )}

          {isEditing && !isUpdating && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setPhoneNumber(userData.numeroTelefono || '');
              }}
            >
              <Icon name="close" size={20} color="#4B0082" />
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 18,
    color: '#4B0082',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginTop: 10,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
  userTypeBadge: {
    backgroundColor: '#4B0082',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
  },
  userTypeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  smallInfoValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  phoneInput: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#6A5ACD',
    fontSize: 16,
    color: '#333',
    paddingVertical: 5,
  },
  actionsContainer: {
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4B0082',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  updatingButton: {
    backgroundColor: '#6A5ACD',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#4B0082',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#4B0082',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});