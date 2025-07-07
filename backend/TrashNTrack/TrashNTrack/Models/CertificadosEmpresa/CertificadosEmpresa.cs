using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

public class CertificadosEmpresa
{
    #region statements
    private static string CertificadoGetAll = @"
    SELECT id_certificado, url_documento, fecha_emision, id_empresa
    FROM CERTIFICADOS_EMPRESA ORDER BY id_certificado";

    private static string CertificadoGetOne = @"
    SELECT id_certificado, url_documento, fecha_emision, id_empresa
    FROM CERTIFICADOS_EMPRESA WHERE id_certificado = @ID";
    #endregion

    #region attributes
    private int _idCertificado;
    private string _urlDocumento;
    private DateTime? _fechaEmision;
    private int _idEmpresa;
    #endregion

    #region properties
    public int IdCertificado { get => _idCertificado; set => _idCertificado = value; }
    public string UrlDocumento { get => _urlDocumento; set => _urlDocumento = value; }
    public DateTime? FechaEmision { get => _fechaEmision; set => _fechaEmision = value; }
    public int IdEmpresa { get => _idEmpresa; set => _idEmpresa = value; }
    #endregion

    #region constructors
    public CertificadosEmpresa()
    {
        _idCertificado = 0;
        _urlDocumento = "";
        _fechaEmision = null;
        _idEmpresa = 0;
    }

    public CertificadosEmpresa(int idCertificado, string urlDocumento, DateTime? fechaEmision, int idEmpresa)
    {
        _idCertificado = idCertificado;
        _urlDocumento = urlDocumento;
        _fechaEmision = fechaEmision;
        _idEmpresa = idEmpresa;
    }
    #endregion

    #region classMethods
    public static List<CertificadosEmpresa> Get()
    {
        SqlCommand command = new SqlCommand(CertificadoGetAll);
        return CertificadosEmpresaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static CertificadosEmpresa Get(int id)
    {
        SqlCommand command = new SqlCommand(CertificadoGetOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        if (table.Rows.Count > 0)
            return CertificadosEmpresaMapper.ToObject(table.Rows[0]);
        else
            throw new Exception($"Certificado con ID {id} no encontrado.");
    }
    #endregion
}
