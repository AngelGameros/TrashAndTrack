using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class TipoResiduos
{
    #region statements
    private static string TipoResiduosGetAll = @"
    SELECT id_tipo_residuo, nombre, descripcion
    FROM TIPO_RESIDUOS ORDER BY id_tipo_residuo";

    private static string TipoResiduosGetOne = @"
    SELECT id_tipo_residuo, nombre, descripcion
    FROM TIPO_RESIDUOS WHERE id_tipo_residuo = @ID";
    #endregion

    #region attributes
    private int _idTipoResiduos;
    private string _nombre;
    private string _descripcion;
    #endregion

    #region properties
    public int IdTipoResiduos { get => _idTipoResiduos; set => _idTipoResiduos = value; }
    public string Nombre { get => _nombre; set => _nombre = value; }
    public string Descripcion { get => _descripcion; set => _descripcion = value; }
    #endregion

    #region constructors
    public TipoResiduos()
    {
        _idTipoResiduos = 0;
        _nombre = "";
        _descripcion = "";
    }

    public TipoResiduos(int idTipoResiduos, string nombre, string descripcion)
    {
        _idTipoResiduos = idTipoResiduos;
        _nombre = nombre;
        _descripcion = descripcion;
    }
    #endregion

    #region classMethods
    public static List<TipoResiduos> Get()
    {
        SqlCommand command = new SqlCommand(TipoResiduosGetAll);
        return TipoResiduosMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static TipoResiduos Get(int id)
    {
        SqlCommand command = new SqlCommand(TipoResiduosGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return TipoResiduosMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Tipo de residuo con ID {id} no encontrado.");
    }
    #endregion
}
