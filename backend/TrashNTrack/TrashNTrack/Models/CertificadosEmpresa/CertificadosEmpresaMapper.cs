using System.Collections.Generic;
using System.Data;

public class CertificadosEmpresaMapper
{
    public static CertificadosEmpresa ToObject(DataRow row)
    {
        int idCertificado = (int)row["id_certificado"];
        string urlDocumento = row["url_documento"]?.ToString() ?? "";
        DateTime? fechaEmision = row["fecha_emision"] != DBNull.Value ? (DateTime)row["fecha_emision"] : (DateTime?)null;
        int idEmpresa = row["id_empresa"] != DBNull.Value ? (int)row["id_empresa"] : 0;

        return new CertificadosEmpresa(idCertificado, urlDocumento, fechaEmision, idEmpresa);
    }

    public static List<CertificadosEmpresa> ToList(DataTable table)
    {
        List<CertificadosEmpresa> list = new List<CertificadosEmpresa>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
