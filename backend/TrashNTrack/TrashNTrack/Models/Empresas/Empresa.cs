using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Text.Json.Serialization; // Agrega esta línea

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

    private static string EmpresaInsert = @"
        insert into EMPRESAS (nombre,rfc,id_ubicacion)
        VALUES (@Nombre, @RFC, @IdUbicacion);"; 

    private static string EmpresaUpdate = @"
        UPDATE Empresas
        SET nombre = @Nombre, fecha_registro = @FechaRegistro, rfc = @RFC, id_ubicacion = @IdUbicacion
        WHERE id_empresa = @IdEmpresa;";
    #endregion

    #region Properties
    public int IdEmpresa { get; set; }
    public string Nombre { get; set; }

    public string FechaRegistro { get; set; }
    public string RFC { get; set; }
    public int IdUbicacion { get; set; }
    #endregion

    #region Constructors
    public Empresa()
    {
        IdEmpresa = 0;
        Nombre = string.Empty;
        FechaRegistro = string.Empty;
        RFC = string.Empty;
        IdUbicacion = 0;
    }

    public Empresa(int id, string nombre, string fechaRegistro, string rfc, int idUbicacion)
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

    public int Insert()
    {
        SqlCommand command = new SqlCommand(EmpresaInsert);
        command.Parameters.AddWithValue("@Nombre", Nombre);
        command.Parameters.AddWithValue("@RFC", RFC);
        command.Parameters.AddWithValue("@IdUbicacion", IdUbicacion);

        IdEmpresa = Convert.ToInt32(SqlServerConnection.ExecuteScalar(command));
        return IdEmpresa;
    }

    public void Update()
    {
        SqlCommand command = new SqlCommand(EmpresaUpdate);
        command.Parameters.AddWithValue("@IdEmpresa", IdEmpresa);
        command.Parameters.AddWithValue("@Nombre", Nombre);
        command.Parameters.AddWithValue("@FechaRegistro", FechaRegistro);
        command.Parameters.AddWithValue("@RFC", RFC);
        command.Parameters.AddWithValue("@IdUbicacion", IdUbicacion);

        SqlServerConnection.ExecuteQuery(command);
    }
    #endregion
}