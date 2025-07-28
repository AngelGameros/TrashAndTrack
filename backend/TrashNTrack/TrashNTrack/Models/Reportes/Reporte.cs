using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Reporte
{
    #region statements
    private static string ReporteGetAll = @"
        SELECT id_reporte, nombre, fecha_reporte, photo_url, descripcion, id_usuario 
        FROM Reportes";

    private static string ReporteGetById = @"
        SELECT id_reporte, nombre, fecha_reporte, photo_url, descripcion, id_usuario 
        FROM Reportes 
        WHERE id_reporte = @Id";

    private static string ReporteGetByUsuario = @"
        SELECT id_reporte, nombre, fecha_reporte, photo_url, descripcion, id_usuario 
        FROM Reportes 
        WHERE id_usuario = @UsuarioId";

    private static string ReporteGetByDateRange = @"
        SELECT id_reporte, nombre, fecha_reporte, photo_url, descripcion, id_usuario 
        FROM Reportes 
        WHERE fecha_reporte BETWEEN @FechaInicio AND @FechaFin";
    #endregion

    #region properties
    public int IdReporte { get; set; }
    public string Nombre { get; set; }
    public DateTime FechaReporte { get; set; }
    public string PhotoUrl { get; set; }
    public string Descripcion { get; set; }
    public int IdUsuario { get; set; }
    #endregion

    #region constructors
    public Reporte()
    {
        IdReporte = 0;
        Nombre = string.Empty;
        FechaReporte = DateTime.MinValue;
        PhotoUrl = string.Empty;
        Descripcion = string.Empty;
        IdUsuario = 0;
    }

    public Reporte(int id, string nombre, DateTime fecha, string photoUrl, string descripcion, int idUsuario)
    {
        IdReporte = id;
        Nombre = nombre;
        FechaReporte = fecha;
        PhotoUrl = photoUrl;
        Descripcion = descripcion;
        IdUsuario = idUsuario;
    }
    #endregion

    #region methods
    public static List<Reporte> GetAll()
    {
        SqlCommand command = new SqlCommand(ReporteGetAll);
        return ReporteMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Reporte GetById(int id)
    {
        SqlCommand command = new SqlCommand(ReporteGetById);
        command.Parameters.AddWithValue("@Id", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? ReporteMapper.ToObject(table.Rows[0]) : null;
    }

    public static List<Reporte> GetByUsuario(int usuarioId)
    {
        SqlCommand command = new SqlCommand(ReporteGetByUsuario);
        command.Parameters.AddWithValue("@UsuarioId", usuarioId);
        return ReporteMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Reporte> GetByDateRange(DateTime fechaInicio, DateTime fechaFin)
    {
        SqlCommand command = new SqlCommand(ReporteGetByDateRange);
        command.Parameters.AddWithValue("@FechaInicio", fechaInicio);
        command.Parameters.AddWithValue("@FechaFin", fechaFin);
        return ReporteMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }
    #endregion
}