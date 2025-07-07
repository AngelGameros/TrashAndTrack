using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class RegistroCarga
{
    #region statements
    private static string RegistroCargaGetAll = @"
    SELECT id_registro_carga, fecha_carga, peso_carga, id_camion, id_contenedor
    FROM REGISTRO_CARGA ORDER BY id_registro_carga";

    private static string RegistroCargaGetOne = @"
    SELECT id_registro_carga, fecha_carga, peso_carga, id_camion, id_contenedor
    FROM REGISTRO_CARGA WHERE id_registro_carga = @ID";
    #endregion

    #region attributes
    private int _idRegistroCarga;
    private DateTime? _fechaCarga;
    private double _pesoCarga;
    private int _idCamion;
    private int _idContenedor;
    #endregion

    #region properties
    public int IdRegistroCarga { get => _idRegistroCarga; set => _idRegistroCarga = value; }
    public DateTime? FechaCarga { get => _fechaCarga; set => _fechaCarga = value; }
    public double PesoCarga { get => _pesoCarga; set => _pesoCarga = value; }
    public int IdCamion { get => _idCamion; set => _idCamion = value; }
    public int IdContenedor { get => _idContenedor; set => _idContenedor = value; }
    #endregion

    #region constructors
    public RegistroCarga()
    {
        _idRegistroCarga = 0;
        _fechaCarga = null;
        _pesoCarga = 0;
        _idCamion = 0;
        _idContenedor = 0;
    }

    public RegistroCarga(int idRegistroCarga, DateTime? fechaCarga, double pesoCarga, int idCamion, int idContenedor)
    {
        _idRegistroCarga = idRegistroCarga;
        _fechaCarga = fechaCarga;
        _pesoCarga = pesoCarga;
        _idCamion = idCamion;
        _idContenedor = idContenedor;
    }
    #endregion

    #region classMethods
    public static List<RegistroCarga> Get()
    {
        SqlCommand command = new SqlCommand(RegistroCargaGetAll);
        return RegistroCargaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static RegistroCarga Get(int id)
    {
        SqlCommand command = new SqlCommand(RegistroCargaGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return RegistroCargaMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Registro de carga con ID {id} no encontrado.");
    }
    #endregion
}
