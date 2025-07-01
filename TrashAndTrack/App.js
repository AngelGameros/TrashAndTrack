// App.js

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/config/Firebase/firebaseConfig';

// Importar las pantallas
import LoginScreen from './src/pages/Login/LoginScreen';
import HomeScreen from './src/pages/Home/HomeScreen';
import ProfileScreen from './src/pages/Profile/ProfileScreen';
import RouteScreen from './src/pages/Route/RouteScreen';
import CalendarScreen from './src/pages/Calendar/CalendarScreen';
import ScanScreen from './src/pages/Scan/ScanScreen';
import ReportsScreen from './src/pages/Reports/ReportsScreen';
import IncidentsScreen from './src/pages/Incidents/IncidentsScreen';
import InfoScreen from './src/pages/Info/InfoScreen';
import ChatScreen from './src/pages/Chat/ChatScreen'; 

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// --- Definición de constantes para los estados de aprobación ---
// Asegúrate de que estas constantes son las mismas que en LoginScreen.js
const STATUS_PENDING = 0;   // Pendiente de aprobación
const STATUS_APPROVED = 1;  // Aprobado
const STATUS_REJECTED = 2;  // Rechazado

// Componente para el contenido personalizado del Drawer (menú lateral)
function CustomDrawerContent(props) {
  const { userName } = props;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert('Sesión Cerrada', 'Has cerrado sesión correctamente.');
    } catch (error) {
      console.error('Error al cerrar sesión:', error.message);
      Alert.alert(
        'Error',
        'No se pudo cerrar sesión. Por favor, inténtalo de nuevo.'
      );
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>Trash & Track</Text>
        <Text style={styles.drawerSubHeaderText}>
          {userName || auth.currentUser?.email || 'Cargando...'}
        </Text>
      </View>
      <DrawerItemList {...props} />
      <TouchableOpacity
        onPress={handleSignOut}
        style={styles.signOutDrawerButton}
      >
        <Text style={styles.signOutDrawerButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

// AppDrawer ya no necesita recibir userName como prop
function AppDrawer(props) {
  const { userName } = props;
  return (
    <Drawer.Navigator
      drawerContent={drawerProps => <CustomDrawerContent {...drawerProps} userName={userName} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleAlign: 'center',
        drawerActiveTintColor: '#007AFF',
        drawerInactiveTintColor: '#333',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
        },
        drawerItemStyle: {
          marginVertical: 5,
        },
      }}
    >
      <Drawer.Screen
        name="HomeModule"
        component={HomeScreen}
        options={{ title: 'Home - Camión Asignado' }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
      <Drawer.Screen
        name="Ruta"
        component={RouteScreen}
        options={{ title: 'Ruta - Asignada' }}
      />
      <Drawer.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{ title: 'Calendario - Recolecciones' }}
      />
      <Drawer.Screen
        name="Escanear"
        component={ScanScreen}
        options={{ title: 'Escanear - QR' }}
      />
      <Drawer.Screen
        name="Reportes"
        component={ReportsScreen}
        options={{ title: 'Reportes - Llenado' }}
      />
      <Drawer.Screen
        name="Incidentes"
        component={IncidentsScreen}
        options={{ title: 'Incidentes - Llenado' }}
      />
      <Drawer.Screen
        name="Informacion"
        component={InfoScreen}
        options={{ title: 'Información' }}
      />
      <Drawer.Screen
        name="ChatAdmin"
        component={ChatScreen}
        options={{ title: 'Chat con Administrador' }}
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Carga inicial de Firebase Auth
  const [approvalCheckLoading, setApprovalCheckLoading] = useState(false); // Carga para la verificación de aprobación
  const [userName, setUserName] = useState('');
  const [isApproved, setIsApproved] = useState(false); // Nuevo estado para la aprobación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Finaliza la carga inicial de Auth

      if (currentUser) {
        setApprovalCheckLoading(true); // Empieza a cargar la verificación de aprobación
        try {
          const docRef = doc(db, "usersApproval", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === STATUS_APPROVED) {
              setIsApproved(true); // Usuario aprobado
              const fullName = [
                userData.nombre,
                userData.apellidoPaterno,
                userData.apellidoMaterno
              ].filter(Boolean).join(' '); // Filtra nulos/vacíos y une con espacio

              setUserName(fullName || currentUser.email); // Establece el nombre completo o el email
            } else {
              setIsApproved(false); // Usuario no aprobado
              await signOut(auth); // Desloguea al usuario si no está aprobado
              Alert.alert(
                'Acceso Denegado',
                'Tu cuenta no está aprobada o ha sido rechazada. Por favor, espera la aprobación o contacta a soporte.'
              );
              setUserName(''); // Limpia el nombre
            }
          } else {
            // Esto es un caso raro: usuario autenticado pero sin documento de aprobación.
            // Por seguridad, se desloguea.
            setIsApproved(false);
            await signOut(auth);
            Alert.alert(
              'Error de Cuenta',
              'Tu cuenta no tiene un registro completo. Contacta a soporte.'
            );
            setUserName('');
          }
        } catch (error) {
          console.error("Error al verificar aprobación o nombre:", error);
          setIsApproved(false); // Por defecto, no aprobado en caso de error
          await signOut(auth); // Desloguea al usuario en caso de error en Firestore
          Alert.alert(
            'Error',
            'No se pudo verificar el estado de tu cuenta. Intenta nuevamente.'
          );
          setUserName('');
        } finally {
          setApprovalCheckLoading(false); // Finaliza la carga de verificación de aprobación
        }
      } else {
        // No hay usuario autenticado, limpiar estados
        setIsApproved(false);
        setUserName('');
        setApprovalCheckLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  if (loading || approvalCheckLoading) {
    // Muestra un indicador de carga mientras se verifica el estado de autenticación
    // O mientras se verifica el estado de aprobación en Firestore
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>
          {loading ? 'Verificando sesión...' : 'Verificando estado de cuenta...'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && isApproved ? ( // Renderiza el AppDrawer SOLO si hay usuario Y está aprobado
          <Stack.Screen name="AppHome">
            {(props) => <AppDrawer {...props} userName={userName} />}
          </Stack.Screen>
        ) : (
          // Si no hay usuario, o no está aprobado, mostrar la pantalla de Login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#007AFF',
    marginBottom: 10,
  },
  drawerHeaderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  drawerSubHeaderText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  signOutDrawerButton: {
    backgroundColor: '#E74C3C',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  signOutDrawerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});