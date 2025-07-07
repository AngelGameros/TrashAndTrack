using System.Collections.Generic;

public class RegistroCargaListResponse : JsonResponse
{
    public List<RegistroCarga> RegistrosCarga { get; set; }

    public static RegistroCargaListResponse GetResponse()
    {
        RegistroCargaListResponse r = new RegistroCargaListResponse();
        r.Status = 0;
        r.RegistrosCarga = RegistroCarga.Get();
        return r;
    }
}
