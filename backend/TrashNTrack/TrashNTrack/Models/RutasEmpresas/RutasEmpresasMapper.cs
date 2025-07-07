using System.Collections.Generic;
using System.Data;

public class RutasEmpresasMapper
{
    public static RutasEmpresas ToObject(DataRow row)
    {
        int idRuta = (int)row["id_ruta"];
        int idEmpresa = (int)row["id_empresa"];

        return new RutasEmpresas(idRuta, idEmpresa);
    }

    public static List<RutasEmpresas> ToList(DataTable table)
    {
        List<RutasEmpresas> list = new List<RutasEmpresas>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
