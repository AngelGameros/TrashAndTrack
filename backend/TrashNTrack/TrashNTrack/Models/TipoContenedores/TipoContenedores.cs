using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class TipoContenedores
{
    #region statements
    private static string TipoContenedoresGetAll = @"
    SELECT id_tipo_contenedor, nombre, descripcion, capacidad_maxima
    FROM TIPO_CONTENEDORES ORDER BY id_tipo_contenedor";

    private static string TipoContenedoresGetOne = @"
    SELECT id_tipo_contenedor, nombre, descripcion, capacidad_maxima
    FROM TIPO_CONTENEDORES WHERE id_tipo_contenedor = @ID";
    #endregion

    #region attributes
    private int _idTipoContenedor;
    private string _nombre;
    private string _descripcion;
    private double _capacidadMaxima;
    #endregion

    #region properties
    public int IdTipoContenedor { get => _idTipoContenedor; set => _idTipoContenedor = value; }
    public string Nombre { get => _nombre; set => _nombre = value; }
    public string Descripcion { get => _descripcion; set => _descripcion = value; }
    public double CapacidadMaxima { get => _capacidadMaxima; set => _capacidadMaxima = value; }
    #endregion

    #region constructors
    public TipoContenedores()
    {
        _idTipoContenedor = 0;
        _nombre = "";
        _descripcion = "";
        _capacidadMaxima = 0;
    }

    public TipoContenedores(int idTipoContenedor, string nombre, string descripcion, double capacidadMaxima)
    {
        _idTipoContenedor = idTipoContenedor;
        _nombre = nombre;
        _descripcion = descripcion;
        _capacidadMaxima = capacidadMaxima;
    }
    #endregion

    #region classMethods
    public static List<TipoContenedores> Get()
    {
        SqlCommand command = new SqlCommand(TipoContenedoresGetAll);
        return TipoContenedoresMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static TipoContenedores Get(int id)
    {
        SqlCommand command = new SqlCommand(TipoContenedoresGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return TipoContenedoresMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Tipo de contenedor con ID {id} no encontrado.");
    }
    #endregion
}
