using System.Collections.Generic;
using System.Data;

public class RegistroCargaMapper
{
    public static RegistroCarga ToObject(DataRow row)
    {
        int idRegistroCarga = (int)row["id_registro_carga"];
        DateTime? fechaCarga = row["fecha_carga"] != DBNull.Value ? (DateTime)row["fecha_carga"] : (DateTime?)null;
        double pesoCarga = row["peso_carga"] != DBNull.Value ? (double)row["peso_carga"] : 0;
        int idCamion = row["id_camion"] != DBNull.Value ? (int)row["id_camion"] : 0;
        int idContenedor = row["id_contenedor"] != DBNull.Value ? (int)row["id_contenedor"] : 0;

        return new RegistroCarga(idRegistroCarga, fechaCarga, pesoCarga, idCamion, idContenedor);
    }

    public static List<RegistroCarga> ToList(DataTable table)
    {
        List<RegistroCarga> list = new List<RegistroCarga>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
