import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { auth } from "../../config/Firebase/firebaseConfig"; // <-- IMPORTACIÓN NUEVA

export default function ReportsScreen({ route }) {
  const [activeTab, setActiveTab] = useState("create");

  // Empresas y selección
  const [empresas, setEmpresas] = useState([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);

  // Contenedores de empresa seleccionada
  const [contenedores, setContenedores] = useState([]);

  // Formulario
  const [reportData, setReportData] = useState({
    reportName: "",
    descripcion: "",
    containerId: "",
    collectedAmount: "",
    containerStatus: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdReports, setCreatedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingContenedores, setLoadingContenedores] = useState(false);

  const idUsuario = route?.params?.idUsuario || 2;
  const [idCamion, setIdCamion] = useState(null); // NUEVO ESTADO

  // Obtener camión asignado automáticamente
  useEffect(() => {
    const fetchCamionAsignado = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const res = await axios.get(`http://192.168.0.2:5000/api/camionasignado/${uid}`);
        if (res.data?.camion?.idCamion) {
          setIdCamion(res.data.camion.idCamion);
        } else {
          Alert.alert("Aviso", "No tienes un camión asignado.");
        }
      } catch (error) {
        console.error("Error al obtener camión asignado:", error.message);
        Alert.alert("Error", "No se pudo obtener tu camión asignado.");
      }
    };
    fetchCamionAsignado();
  }, []);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await axios.get("http://192.168.0.2:5000/api/empresas");
        setEmpresas(res.data.data || []);
        if (res.data.data.length > 0) {
          setEmpresaSeleccionada(res.data.data[0].id);
        }
      } catch (e) {
        Alert.alert("Error", "No se pudieron cargar las empresas");
      }
    };
    fetchEmpresas();
  }, []);

  useEffect(() => {
    if (!empresaSeleccionada) return;

    setLoadingContenedores(true);
    const fetchContenedores = async () => {
      try {
        const res = await axios.get(
          `http://192.168.0.2:5000/api/contenedores/empresa/${empresaSeleccionada}`
        );
        setContenedores(res.data.contenedores || []);
        setReportData((prev) => ({ ...prev, containerId: "" }));
      } catch (e) {
        Alert.alert("Error", "No se pudieron cargar los contenedores");
      } finally {
        setLoadingContenedores(false);
      }
    };
    fetchContenedores();
  }, [empresaSeleccionada]);

  useEffect(() => {
    if (activeTab !== "view") return;

    const fetchReports = async () => {
      setLoadingReports(true);
      try {
        const uid = auth.currentUser.uid;
        const response = await axios.get(
          `http://192.168.0.2:5000/api/reportes/uid/${uid}`
        );
        if (response.data.status === 0) {
          setCreatedReports(response.data.data);
        } else {
          Alert.alert(
            "Error",
            response.data.message || "No se pudieron obtener los reportes."
          );
        }
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los reportes.");
      } finally {
        setLoadingReports(false);
      }
    };
    fetchReports();
  }, [activeTab]);

  const handleInputChange = (field, value) => {
    setReportData({ ...reportData, [field]: value });
  };

  const handleSubmitReport = async () => {
    const {
      reportName,
      containerId,
      collectedAmount,
      containerStatus,
      descripcion,
    } = reportData;

    if (!reportName || !containerId || !collectedAmount || !containerStatus) {
      Alert.alert("Campos incompletos", "Completa todos los campos obligatorios.");
      return;
    }

    if (!idCamion) {
      Alert.alert("Sin camión asignado", "No se puede enviar el reporte sin un camión asignado.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nombre", reportName);
      formData.append("descripcion", descripcion || "");
      formData.append("idContenedor", parseInt(containerId));
      formData.append("cantidadRecolectada", parseFloat(collectedAmount));
      formData.append("estadoContenedor", containerStatus);
      formData.append("idUsuario", idUsuario);
      formData.append("idCamion", idCamion); // <-- NUEVO DATO

      const response = await axios.post(
        "http://192.168.0.2:5000/api/reportes/registrar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === 0) {
        Alert.alert("Éxito", "Reporte registrado correctamente.");
        setReportData({
          reportName: "",
          descripcion: "",
          containerId: "",
          collectedAmount: "",
          containerStatus: "",
        });
        setActiveTab("view");
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Error al registrar el reporte."
        );
      }
    } catch (error) {
      console.error("Error completo:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Hubo un error al registrar el reporte."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.reportItem}>
      <View style={styles.reportHeader}>
        <MaterialIcons name="description" size={24} color="#00796B" />
        <Text style={styles.reportTitle}>{item.nombre}</Text>
        <Text style={styles.reportDate}>{item.fecha}</Text>
      </View>
      <Text style={styles.reportDetail}>
        ID Contenedor:{" "}
        <Text style={styles.reportDetailValue}>{item.containerId}</Text>
      </Text>
      <Text style={styles.reportDetail}>
        Cantidad Recolectada:{" "}
        <Text style={styles.reportDetailValue}>{item.collectedAmount}</Text>
      </Text>
      <Text style={styles.reportDetail}>
        Estado Contenedor:{" "}
        <Text style={styles.reportDetailValue}>{item.containerStatus}</Text>
      </Text>
      {item.descripcion ? (
        <Text style={styles.reportDetail}>
          Descripción:{" "}
          <Text style={styles.reportDetailValue}>{item.descripcion}</Text>
        </Text>
      ) : null}
    </View>
  );

  const renderCreateReportTab = () => (
    <ScrollView contentContainerStyle={styles.tabContentScroll}>
      <Text style={styles.formLabel}>Empresa:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={empresaSeleccionada}
          onValueChange={(itemValue) => setEmpresaSeleccionada(itemValue)}
          mode="dropdown"
          style={{ backgroundColor: "#fff" }}
        >
          {empresas.map((empresa) => (
            <Picker.Item
              key={empresa.id.toString()} // <- ESTA LÍNEA ES IMPORTANTE
              label={empresa.nombre}
              value={empresa.id}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.formLabel}>Contenedor:</Text>
      {loadingContenedores ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={reportData.containerId}
            onValueChange={(val) => handleInputChange("containerId", val)}
            mode="dropdown"
            style={{ backgroundColor: "#fff" }}
          >
            <Picker.Item label="Selecciona un contenedor" value="" />
            {contenedores.map((c) => (
              <Picker.Item
                key={c.id.toString()}
                label={`${c.id} - ${c.descripcion} (${
                  c.tipoContenedor || "Sin tipo"
                })`}
                value={c.id}
              />
            ))}
          </Picker>
        </View>
      )}

      <Text style={styles.formLabel}>Nombre del Reporte:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Recolección Norte"
        value={reportData.reportName}
        onChangeText={(text) => handleInputChange("reportName", text)}
      />

      <Text style={styles.formLabel}>Cantidad Recolectada (kg/L):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Ej: 500"
        value={reportData.collectedAmount}
        onChangeText={(text) => handleInputChange("collectedAmount", text)}
      />

      <Text style={styles.formLabel}>Estado del Contenedor:</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Vacío"
        value={reportData.containerStatus}
        onChangeText={(text) => handleInputChange("containerStatus", text)}
      />

      <Text style={styles.formLabel}>Descripción / Observaciones:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        placeholder="Detalles adicionales..."
        value={reportData.descripcion}
        onChangeText={(text) => handleInputChange("descripcion", text)}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitReport}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>ENVIAR REPORTE</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  const renderViewReportsTab = () => (
    <View style={styles.tabContent}>
      {loadingReports ? (
        <ActivityIndicator
          size="large"
          color="#00796B"
          style={{ marginTop: 30 }}
        />
      ) : createdReports.length === 0 ? (
        <Text style={styles.noReportsText}>No hay reportes creados aún.</Text>
      ) : (
        <FlatList
          data={createdReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.flatListContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Reportes de Recolección</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "create" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("create")}
        >
          <MaterialIcons
            name="add-task"
            size={20}
            color={activeTab === "create" ? "#fff" : "#00796B"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "create" && styles.activeTabButtonText,
            ]}
          >
            Nuevo Reporte
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "view" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("view")}
        >
          <MaterialIcons
            name="view-list"
            size={20}
            color={activeTab === "view" ? "#fff" : "#00796B"}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "view" && styles.activeTabButtonText,
            ]}
          >
            Ver Reportes
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "create"
        ? renderCreateReportTab()
        : renderViewReportsTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F9FC" },
  headerContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 22, fontWeight: "bold", color: "#00796B" },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    borderRadius: 8,
    padding: 8,
  },
  activeTabButton: {
    backgroundColor: "#00796B",
  },
  tabButtonText: {
    marginLeft: 6,
    color: "#00796B",
    fontWeight: "600",
  },
  activeTabButtonText: {
    color: "#fff",
  },
  tabContentScroll: {
    padding: 20,
  },
  formLabel: {
    marginBottom: 6,
    color: "#333",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 10,
    marginBottom: 16,
    borderColor: "#ccc",
    borderWidth: 1,
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginBottom: 16,
    overflow: "hidden",
  },
  submitButton: {
    backgroundColor: "#00796B",
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  reportItem: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderRadius: 8,
    padding: 16,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00796B",
    flex: 1,
  },
  reportDate: {
    color: "#555",
    marginLeft: 10,
  },
  reportDetail: {
    fontWeight: "600",
    marginTop: 2,
  },
  reportDetailValue: {
    fontWeight: "400",
  },
  noReportsText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  flatListContentContainer: {
    paddingBottom: 40,
  },
});
