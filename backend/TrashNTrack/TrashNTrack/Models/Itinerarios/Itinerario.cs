using System;
using System.Collections.Generic;
using System.Data;
using Microsoft.Data.SqlClient;

public class Itinerario
{
    #region SQL Statements
    private static string ItinerarioGetAll = @"
        SELECT id_itinerario, estado, fecha_programada, id_usuario, id_ruta 
        FROM Itinerarios";

    private static string ItinerarioGetById = @"
        SELECT id_itinerario, estado, fecha_programada, id_usuario, id_ruta 
        FROM Itinerarios 
        WHERE id_itinerario = @Id";

    private static string ItinerarioGetByUsuario = @"
        SELECT id_itinerario, estado, fecha_programada, id_usuario, id_ruta 
        FROM Itinerarios 
        WHERE id_usuario = @UsuarioId";

    private static string ItinerarioGetByRuta = @"
        SELECT id_itinerario, estado, fecha_programada, id_usuario, id_ruta 
        FROM Itinerarios 
        WHERE id_ruta = @RutaId";

    private static string ItinerarioGetByEstado = @"
        SELECT id_itinerario, estado, fecha_programada, id_usuario, id_ruta 
        FROM Itinerarios 
        WHERE estado = @Estado";

    #endregion

    #region Properties
    public int IdItinerario { get; set; }
    public string Estado { get; set; }
    public DateTime FechaProgramada { get; set; }
    public int IdUsuario { get; set; }
    public int IdRuta { get; set; }
    #endregion

    #region Constructors
    public Itinerario()
    {
        IdItinerario = 0;
        Estado = "Pendiente"; // Valores comunes: Pendiente, EnProgreso, Completado, Cancelado
        FechaProgramada = DateTime.Now;
        IdUsuario = 0;
        IdRuta = 0;
    }

    public Itinerario(int id, string estado, DateTime fechaProgramada, int idUsuario, int idRuta)
    {
        IdItinerario = id;
        Estado = estado;
        FechaProgramada = fechaProgramada;
        IdUsuario = idUsuario;
        IdRuta = idRuta;
    }
    #endregion

    #region Methods
    public static List<Itinerario> GetAll()
    {
        SqlCommand command = new SqlCommand(ItinerarioGetAll);
        return ItinerarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Itinerario GetById(int id)
    {
        SqlCommand command = new SqlCommand(ItinerarioGetById);
        command.Parameters.AddWithValue("@Id", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? ItinerarioMapper.ToObject(table.Rows[0]) : null;
    }

    public static List<Itinerario> GetByUsuario(int usuarioId)
    {
        SqlCommand command = new SqlCommand(ItinerarioGetByUsuario);
        command.Parameters.AddWithValue("@UsuarioId", usuarioId);
        return ItinerarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Itinerario> GetByRuta(int rutaId)
    {
        SqlCommand command = new SqlCommand(ItinerarioGetByRuta);
        command.Parameters.AddWithValue("@RutaId", rutaId);
        return ItinerarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Itinerario> GetByEstado(string estado)
    {
        SqlCommand command = new SqlCommand(ItinerarioGetByEstado);
        command.Parameters.AddWithValue("@Estado", estado);
        return ItinerarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }
    #endregion
}