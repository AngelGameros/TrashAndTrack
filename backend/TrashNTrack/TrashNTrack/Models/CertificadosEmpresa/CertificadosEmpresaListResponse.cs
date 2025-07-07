using System.Collections.Generic;

public class CertificadosEmpresaListResponse : JsonResponse
{
    public List<CertificadosEmpresa> Certificados { get; set; }

    public static CertificadosEmpresaListResponse GetResponse()
    {
        CertificadosEmpresaListResponse r = new CertificadosEmpresaListResponse();
        r.Status = 0;
        r.Certificados = CertificadosEmpresa.Get();
        return r;
    }
}
