using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Ruta
{
    #region statements
    private static string RutaGetAll = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, estado, id_usuario_asignado, progreso_ruta
        FROM RUTAS"; // Corregido para coincidir con la tabla

    private static string RutaGetById = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, estado, id_usuario_asignado, progreso_ruta
        FROM RUTAS
        WHERE id_ruta = @Id"; // Corregido para coincidir con la tabla

    private static string RutaGetByUsuarioAsignado = @"
        SELECT id_ruta, nombre_ruta, fecha_creacion, descripcion, estado, id_usuario_asignado, progreso_ruta
        FROM RUTAS
        WHERE id_usuario_asignado = @IdUsuarioAsignado"; // Nuevo método de consulta

    private static string RutaUpdateProgresoEstado = @"
        UPDATE RUTAS
        SET progreso_ruta = @ProgresoRuta, estado = @Estado
        WHERE id_ruta = @IdRuta";

    // New: SQL statement for inserting a new Ruta
    private static string RutaInsert = @"
        INSERT INTO RUTAS (nombre_ruta, fecha_creacion, descripcion, estado, id_usuario_asignado, progreso_ruta)
        VALUES (@NombreRuta, @FechaCreacion, @Descripcion, @Estado, @IdUsuarioAsignado, @ProgresoRuta);
        SELECT SCOPE_IDENTITY();"; // Returns the ID of the newly inserted row
    #endregion

    #region properties
    public int IdRuta { get; set; }
    public string NombreRuta { get; set; }
    public DateTime FechaCreacion { get; set; }
    public string Descripcion { get; set; }
    public string Estado { get; set; } // Nueva propiedad
    public int? IdUsuarioAsignado { get; set; } // Nueva propiedad, nullable
    public int ProgresoRuta { get; set; } // Nueva propiedad
    #endregion

    #region constructors
    public Ruta()
    {
        IdRuta = 0;
        NombreRuta = "";
        FechaCreacion = DateTime.MinValue;
        Descripcion = "";
        Estado = "";
        IdUsuarioAsignado = null;
        ProgresoRuta = 0;
    }

    public Ruta(int id, string nombre, DateTime fecha, string descripcion, string estado, int? idUsuarioAsignado, int progresoRuta)
    {
        IdRuta = id;
        NombreRuta = nombre;
        FechaCreacion = fecha;
        Descripcion = descripcion;
        Estado = estado;
        IdUsuarioAsignado = idUsuarioAsignado;
        ProgresoRuta = progresoRuta;
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

    public static List<Ruta> GetByUsuarioAsignado(int idUsuarioAsignado)
    {
        SqlCommand command = new SqlCommand(RutaGetByUsuarioAsignado);
        command.Parameters.AddWithValue("@IdUsuarioAsignado", idUsuarioAsignado);
        return RutaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static bool UpdateProgresoAndEstado(int idRuta, int progresoRuta, string estado)
    {
        SqlCommand command = new SqlCommand(RutaUpdateProgresoEstado);
        command.Parameters.AddWithValue("@IdRuta", idRuta);
        command.Parameters.AddWithValue("@ProgresoRuta", progresoRuta);
        command.Parameters.AddWithValue("@Estado", estado);
        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }

    // New: Insert method
    public int Insert()
    {
        SqlCommand command = new SqlCommand(RutaInsert);
        command.Parameters.AddWithValue("@NombreRuta", NombreRuta);
        command.Parameters.AddWithValue("@FechaCreacion", FechaCreacion);
        command.Parameters.AddWithValue("@Descripcion", Descripcion);
        command.Parameters.AddWithValue("@Estado", Estado);
        // Handle nullable parameter for id_usuario_asignado
        if (IdUsuarioAsignado.HasValue)
        {
            command.Parameters.AddWithValue("@IdUsuarioAsignado", IdUsuarioAsignado.Value);
        }
        else
        {
            command.Parameters.AddWithValue("@IdUsuarioAsignado", DBNull.Value);
        }
        command.Parameters.AddWithValue("@ProgresoRuta", ProgresoRuta);

        // ExecuteScalar is used because SCOPE_IDENTITY() returns a single value (the new ID)
        IdRuta = Convert.ToInt32(SqlServerConnection.ExecuteScalar(command));
        return IdRuta;
    }
    #endregion
}