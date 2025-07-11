using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Empresa
{
    #region SQL Statements
    private static string EmpresaGetAll = @"
        SELECT id_empresa, nombre, fecha_registro, rfc, id_ubicacion 
        FROM Empresas";

    private static string EmpresaGetById = @"
        SELECT id_empresa, nombre, fecha_registro, rfc, id_ubicacion 
        FROM Empresas 
        WHERE id_empresa = @Id";

    private static string EmpresaGetByUbicacion = @"
        SELECT id_empresa, nombre, fecha_registro, rfc, id_ubicacion 
        FROM Empresas 
        WHERE id_ubicacion = @UbicacionId";

    private static string EmpresaSearchByName = @"
        SELECT id_empresa, nombre, fecha_registro, rfc, id_ubicacion 
        FROM Empresas 
        WHERE nombre LIKE @SearchTerm";
    #endregion

    #region Properties
    public int IdEmpresa { get; set; }
    public string Nombre { get; set; }
    public DateTime FechaRegistro { get; set; }
    public string RFC { get; set; }
    public int IdUbicacion { get; set; }
    #endregion

    #region Constructors
    public Empresa()
    {
        IdEmpresa = 0;
        Nombre = string.Empty;
        FechaRegistro = DateTime.MinValue;
        RFC = string.Empty;
        IdUbicacion = 0;
    }

    public Empresa(int id, string nombre, DateTime fechaRegistro, string rfc, int idUbicacion)
    {
        IdEmpresa = id;
        Nombre = nombre;
        FechaRegistro = fechaRegistro;
        RFC = rfc;
        IdUbicacion = idUbicacion;
    }
    #endregion

    #region Methods
    public static List<Empresa> GetAll()
    {
        SqlCommand command = new SqlCommand(EmpresaGetAll);
        return EmpresaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Empresa GetById(int id)
    {
        SqlCommand command = new SqlCommand(EmpresaGetById);
        command.Parameters.AddWithValue("@Id", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? EmpresaMapper.ToObject(table.Rows[0]) : null;
    }

    public static List<Empresa> GetByUbicacion(int ubicacionId)
    {
        SqlCommand command = new SqlCommand(EmpresaGetByUbicacion);
        command.Parameters.AddWithValue("@UbicacionId", ubicacionId);
        return EmpresaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Empresa> SearchByName(string searchTerm)
    {
        SqlCommand command = new SqlCommand(EmpresaSearchByName);
        command.Parameters.AddWithValue("@SearchTerm", $"%{searchTerm}%");
        return EmpresaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }
    #endregion
}