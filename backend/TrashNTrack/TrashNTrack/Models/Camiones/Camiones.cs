using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Camiones
{
    #region statements
    private static string CamionGetAll = @"
    SELECT id_camion, placa, marca, anio, capacidad_carga, modelo, id_usuario
    FROM CAMIONES ORDER BY id_camion";

    private static string CamionGetOne = @"
    SELECT id_camion, placa, marca, anio, capacidad_carga, modelo, id_usuario
    FROM CAMIONES WHERE id_camion = @ID";
    #endregion

    #region attributes
    private int _idCamion;
    private string _placa;
    private string _marca;
    private int _anio;
    private double _capacidadCarga;
    private string _modelo;
    private int _idUsuario;
    #endregion

    #region properties
    public int IdCamion { get => _idCamion; set => _idCamion = value; }
    public string Placa { get => _placa; set => _placa = value; }
    public string Marca { get => _marca; set => _marca = value; }
    public int Anio { get => _anio; set => _anio = value; }
    public double CapacidadCarga { get => _capacidadCarga; set => _capacidadCarga = value; }
    public string Modelo { get => _modelo; set => _modelo = value; }
    public int IdUsuario { get => _idUsuario; set => _idUsuario = value; }
    #endregion

    #region constructors
    public Camiones()
    {
        _idCamion = 0;
        _placa = "";
        _marca = "";
        _anio = 0;
        _capacidadCarga = 0;
        _modelo = "";
        _idUsuario = 0;
    }

    public Camiones(int idCamion, string placa, string marca, int anio, double capacidadCarga, string modelo, int idUsuario)
    {
        _idCamion = idCamion;
        _placa = placa;
        _marca = marca;
        _anio = anio;
        _capacidadCarga = capacidadCarga;
        _modelo = modelo;
        _idUsuario = idUsuario;
    }
    #endregion

    #region classMethods
    public static List<Camiones> Get()
    {
        SqlCommand command = new SqlCommand(CamionGetAll);
        return CamionesMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Camiones Get(int id)
    {
        SqlCommand command = new SqlCommand(CamionGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return CamionesMapper.ToObject(table.Rows[0]);
        else
            throw new UsuarioNotFoundException(id);
    }
    #endregion
}
