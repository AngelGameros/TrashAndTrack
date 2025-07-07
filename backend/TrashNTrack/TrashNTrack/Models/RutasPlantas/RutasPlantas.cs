using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class RutasPlantas
{
    #region statements
    private static string RutasPlantasGetAll = @"
    SELECT id_ruta, id_planta
    FROM RUTAS_PLANTAS ORDER BY id_ruta, id_planta";

    private static string RutasPlantasGetOne = @"
    SELECT id_ruta, id_planta
    FROM RUTAS_PLANTAS WHERE id_ruta = @ID_RUTA AND id_planta = @ID_PLANTA";
    #endregion

    #region attributes
    private int _idRuta;
    private int _idPlanta;
    #endregion

    #region properties
    public int IdRuta { get => _idRuta; set => _idRuta = value; }
    public int IdPlanta { get => _idPlanta; set => _idPlanta = value; }
    #endregion

    #region constructors
    public RutasPlantas()
    {
        _idRuta = 0;
        _idPlanta = 0;
    }

    public RutasPlantas(int idRuta, int idPlanta)
    {
        _idRuta = idRuta;
        _idPlanta = idPlanta;
    }
    #endregion

    #region classMethods
    public static List<RutasPlantas> Get()
    {
        SqlCommand command = new SqlCommand(RutasPlantasGetAll);
        return RutasPlantasMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static RutasPlantas Get(int idRuta, int idPlanta)
    {
        SqlCommand command = new SqlCommand(RutasPlantasGetOne);
        command.Parameters.AddWithValue("@ID_RUTA", idRuta);
        command.Parameters.AddWithValue("@ID_PLANTA", idPlanta);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return RutasPlantasMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Registro no encontrado para Ruta {idRuta} y Planta {idPlanta}.");
    }
    #endregion
}
