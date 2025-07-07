using System.Collections.Generic;

public class UbicacionListResponse : JsonResponse
{
    public List<Ubicacion> Ubicaciones { get; set; }

    public static UbicacionListResponse GetResponse()
    {
        UbicacionListResponse r = new UbicacionListResponse();
        r.Status = 0;
        r.Ubicaciones = Ubicacion.Get();
        return r;
    }
}
