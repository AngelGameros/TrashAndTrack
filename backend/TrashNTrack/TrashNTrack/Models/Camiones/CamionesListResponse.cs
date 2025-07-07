using System.Collections.Generic;

public class CamionesListResponse : JsonResponse
{
    public List<Camiones> Camiones { get; set; }

    public static CamionesListResponse GetResponse()
    {
        CamionesListResponse r = new CamionesListResponse();
        r.Status = 0;
        r.Camiones = Camiones.Get();
        return r;
    }
}
