import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../../config/Firebase/firebaseConfig";

const formatDateTime = (dateObj) => {
  if (!dateObj) return "";
  return new Date(dateObj).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Tijuana",
  });
};

const IncidentsScreen = () => {
  const [incidentName, setIncidentName] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentImage, setIncidentImage] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const IP_URL = process.env.EXPO_PUBLIC_IP_URL

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(
        `http://${IP_URL}:5000/api/incidentesporusuario/${uid}`
      );
      const data = await res.json();

      if (data.status === 0 && Array.isArray(data.data)) {
        const formatted = data.data.map((incidente) => ({
          id: incidente.id,
          userId: incidente.idUsuario,
          name: incidente.nombre,
          description: incidente.descripcion,
          date: parseDateString(incidente.fechaIncidente),
          imageUri: incidente.photoUrl,
        }));

        setIncidents(formatted);
      } else {
        setIncidents([]);
        Alert.alert("Sin datos", data.message || "No hay incidentes.");
      }
    } catch (error) {
      setIncidents([]);
      Alert.alert("Error", "No se pudo conectar al servidor de incidentes.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const parseDateString = (dateString) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso Requerido", "Necesitas acceso a la cámara.");
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (!(await requestCameraPermission())) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0)
      setIncidentImage(result.assets[0]);
  };

  const uploadToCloudinary = async () => {
    const form = new FormData();
    const ts = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const fileName = `${ts}_${auth.currentUser.uid}.jpg`;
    form.append("file", {
      uri: incidentImage.uri,
      name: fileName,
      type: "image/jpeg",
    });
    form.append("upload_preset", "incidentes_app");
    form.append("cloud_name", "dlkonkhzu");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dlkonkhzu/image/upload",
      {
        method: "POST",
        body: form,
      }
    );
    const json = await res.json();
    return json.secure_url;
  };

  const handleSaveIncident = async () => {
    if (!incidentName || !incidentDescription || !incidentImage) {
      Alert.alert("Faltan datos", "Completa todos los campos y toma una foto.");
      return;
    }

    try {
      const imageUrl = await uploadToCloudinary();
      const nowUtc = new Date().toISOString();

      const form = new FormData();
      form.append("nombre", incidentName);
      form.append("descripcion", incidentDescription);
      form.append("fechaIncidente", nowUtc);
      form.append("firebaseUid", uid);
      form.append("foto", imageUrl);

      const res = await fetch(
        `http://${IP_URL}:5000/api/incidentesporusuario`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res.json();

      if (data.status === 0) {
        Alert.alert("Éxito", "Incidente registrado correctamente.");
        setIncidentName("");
        setIncidentDescription("");
        setIncidentImage(null);
        setShowForm(false);
        fetchIncidents();
      } else {
        Alert.alert("Error", data.message || "No se pudo registrar.");
      }
    } catch (err) {
      Alert.alert("Error", "Error al guardar incidente: " + err.message);
    }
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setModalVisible(true);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Gestión de Incidentes</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, !showForm && styles.activeButton]}
            onPress={() => setShowForm(false)}
          >
            <MaterialIcons
              name="list"
              size={20}
              color={!showForm ? "#fff" : "#00796B"}
            />
            <Text
              style={[
                styles.actionButtonText,
                !showForm && styles.activeButtonText,
              ]}
            >
              Ver Incidentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, showForm && styles.activeButton]}
            onPress={() => setShowForm(true)}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={20}
              color={showForm ? "#fff" : "#00796B"}
            />
            <Text
              style={[
                styles.actionButtonText,
                showForm && styles.activeButtonText,
              ]}
            >
              Nuevo Incidente
            </Text>
          </TouchableOpacity>
        </View>

        {showForm ? (
          <>
            <TextInput
              placeholder="Nombre"
              style={styles.input}
              value={incidentName}
              onChangeText={setIncidentName}
            />
            <TextInput
              placeholder="Descripción"
              style={[styles.input, styles.textArea]}
              multiline
              value={incidentDescription}
              onChangeText={setIncidentDescription}
            />
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={takePhoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="#fff" />
              <Text style={styles.imagePickerButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            {incidentImage && (
              <Image
                source={{ uri: incidentImage.uri }}
                style={styles.imagePreview}
              />
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveIncident}
            >
              <MaterialIcons name="save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Guardar Incidente</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {incidents.length === 0 ? (
              <View style={styles.noIncidents}>
                <MaterialIcons name="error-outline" size={60} color="#B0BEC5" />
                <Text style={styles.noIncidentsText}>
                  Aún no has reportado ningún incidente.
                </Text>
                <Text style={styles.noIncidentsText}>
                  ¡Comienza reportando uno nuevo!
                </Text>
              </View>
            ) : (
              incidents.map((incident) => (
                <TouchableOpacity
                  key={incident.id.toString()}
                  style={styles.incidentCard}
                  onPress={() => handleViewIncident(incident)}
                >
                  <View style={styles.incidentCardHeader}>
                    <Text style={styles.incidentCardTitle}>{incident.name}</Text>
                    <Text style={styles.incidentCardDate}>
                      {formatDateTime(incident.date)}
                    </Text>
                  </View>
                  <Text
                    style={styles.incidentCardDescription}
                    numberOfLines={2}
                  >
                    {incident.description}
                  </Text>
                  {incident.imageUri && (
                    <MaterialIcons
                      name="image"
                      size={20}
                      color="#0097A7"
                      style={styles.incidentCardImageIndicator}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={28} color="#9E9E9E" />
              </TouchableOpacity>
              {selectedIncident && (
                <ScrollView contentContainerStyle={styles.modalScrollContent}>
                  <Text style={styles.modalTitle}>{selectedIncident.name}</Text>
                  <Text style={styles.detailText}>
                    {formatDateTime(selectedIncident.date)}
                  </Text>
                  <Text style={styles.sectionHeader}>Descripción</Text>
                  <Text style={styles.modalDescription}>
                    {selectedIncident.description}
                  </Text>
                  {selectedIncident.imageUri && (
                    <>
                      <Text style={styles.sectionHeader}>Evidencia</Text>
                      <Image
                        source={{ uri: selectedIncident.imageUri }}
                        style={styles.modalImage}
                      />
                    </>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: "#E0F2F7",
    borderRadius: 10,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderRadius: 10,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#00796B",
  },
  activeButton: {
    backgroundColor: "#0097A7",
  },
  activeButtonText: {
    color: "#fff",
  },
  formContainer: {
    paddingBottom: 80,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#37474F",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CFD8DC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#2C3E50",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 2,
  },
  imagePickerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 10,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    resizeMode: "cover",
    marginBottom: 10,
  },
  imageName: {
    fontSize: 14,
    color: "#388E3C",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#00796B",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  listContentContainer: {
    paddingBottom: 80,
  },
  noIncidents: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    opacity: 0.8,
  },
  noIncidentsText: {
    fontSize: 16,
    color: "#78909C",
    fontWeight: "500",
    marginTop: 10,
    textAlign: "center",
  },
  incidentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 6,
    borderLeftColor: "#FBC02D",
    position: "relative",
  },
  incidentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  incidentCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
    marginRight: 10,
  },
  incidentCardDate: {
    fontSize: 12,
    color: "#757575",
    fontWeight: "500",
  },
  incidentCardDescription: {
    fontSize: 14,
    color: "#546E7A",
    marginBottom: 5,
  },
  incidentCardImageIndicator: {
    position: "absolute",
    bottom: 10,
    right: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "85%",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 20,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#37474F",
    marginLeft: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#78909C",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
    paddingBottom: 5,
  },
  modalDescription: {
    fontSize: 16,
    color: "#546E7A",
    lineHeight: 24,
    marginBottom: 15,
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    resizeMode: "contain",
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: "#E0E0E0",
  },
  modalScrollContent: {
    paddingBottom: 50,
  },
});

export default IncidentsScreen;
