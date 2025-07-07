using System.Collections.Generic;

public class RutasEmpresasListResponse : JsonResponse
{
    public List<RutasEmpresas> RutasEmpresas { get; set; }

    public static RutasEmpresasListResponse GetResponse()
    {
        RutasEmpresasListResponse r = new RutasEmpresasListResponse();
        r.Status = 0;
        r.RutasEmpresas = RutasEmpresas.Get();
        return r;
    }
}
