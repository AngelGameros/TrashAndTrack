using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Ruta
{
    #region statements
    private static string RutaGetAll = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, id_empresa, id_planta 
        FROM Rutas";

    private static string RutaGetById = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, id_empresa, id_planta 
        FROM Rutas 
        WHERE id_ruta = @Id";

    private static string RutaGetByEmpresa = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, id_empresa, id_planta 
        FROM Rutas 
        WHERE id_empresa = @EmpresaId";

    private static string RutaGetByPlanta = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, id_empresa, id_planta 
        FROM Rutas 
        WHERE id_planta = @PlantaId";
    #endregion

    #region properties
    public int IdRuta { get; set; }
    public string NombreRuta { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string Descripcion { get; set; }
    public int IdEmpresa { get; set; }
    public int IdPlanta { get; set; }
    #endregion

    #region constructors
    public Ruta()
    {
        IdRuta = 0;
        NombreRuta = "";
        FechaCreacion = DateTime.MinValue;
        Descripcion = "";
        IdEmpresa = 0;
        IdPlanta = 0;
    }

    public Ruta(int id, string nombre, DateTime fecha, string descripcion, int idEmpresa, int idPlanta)
    {
        IdRuta = id;
        NombreRuta = nombre;
        FechaCreacion = fecha;
        Descripcion = descripcion;
        IdEmpresa = idEmpresa;
        IdPlanta = idPlanta;
    }
    #endregion

    #region methods
    public static List<Ruta> GetAll()
    {
        SqlCommand command = new SqlCommand(RutaGetAll);
        return RutaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Ruta GetById(int id)
    {
        SqlCommand command = new SqlCommand(RutaGetById);
        command.Parameters.AddWithValue("@Id", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? RutaMapper.ToObject(table.Rows[0]) : null;
    }

    public static List<Ruta> GetByEmpresa(int empresaId)
    {
        SqlCommand command = new SqlCommand(RutaGetByEmpresa);
        command.Parameters.AddWithValue("@EmpresaId", empresaId);
        return RutaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Ruta> GetByPlanta(int plantaId)
    {
        SqlCommand command = new SqlCommand(RutaGetByPlanta);
        command.Parameters.AddWithValue("@PlantaId", plantaId);
        return RutaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }
    #endregion
}