using System.Collections.Generic;
using System.Data;

public class RutasPlantasMapper
{
    public static RutasPlantas ToObject(DataRow row)
    {
        int idRuta = (int)row["id_ruta"];
        int idPlanta = (int)row["id_planta"];

        return new RutasPlantas(idRuta, idPlanta);
    }

    public static List<RutasPlantas> ToList(DataTable table)
    {
        List<RutasPlantas> list = new List<RutasPlantas>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
