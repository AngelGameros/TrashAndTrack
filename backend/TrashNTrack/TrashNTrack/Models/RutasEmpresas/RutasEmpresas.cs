using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class RutasEmpresas
{
    #region statements
    private static string RutasEmpresasGetAll = @"
    SELECT id_ruta, id_empresa
    FROM RUTAS_EMPRESAS ORDER BY id_ruta, id_empresa";

    private static string RutasEmpresasGetOne = @"
    SELECT id_ruta, id_empresa
    FROM RUTAS_EMPRESAS WHERE id_ruta = @ID_RUTA AND id_empresa = @ID_EMPRESA";
    #endregion

    #region attributes
    private int _idRuta;
    private int _idEmpresa;
    #endregion

    #region properties
    public int IdRuta { get => _idRuta; set => _idRuta = value; }
    public int IdEmpresa { get => _idEmpresa; set => _idEmpresa = value; }
    #endregion

    #region constructors
    public RutasEmpresas()
    {
        _idRuta = 0;
        _idEmpresa = 0;
    }

    public RutasEmpresas(int idRuta, int idEmpresa)
    {
        _idRuta = idRuta;
        _idEmpresa = idEmpresa;
    }
    #endregion

    #region classMethods
    public static List<RutasEmpresas> Get()
    {
        SqlCommand command = new SqlCommand(RutasEmpresasGetAll);
        return RutasEmpresasMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static RutasEmpresas Get(int idRuta, int idEmpresa)
    {
        SqlCommand command = new SqlCommand(RutasEmpresasGetOne);
        command.Parameters.AddWithValue("@ID_RUTA", idRuta);
        command.Parameters.AddWithValue("@ID_EMPRESA", idEmpresa);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return RutasEmpresasMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Registro no encontrado para Ruta {idRuta} y Empresa {idEmpresa}.");
    }
    #endregion
}
