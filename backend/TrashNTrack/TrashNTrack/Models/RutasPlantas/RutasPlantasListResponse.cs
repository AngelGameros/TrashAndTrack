using System.Collections.Generic;

public class RutasPlantasListResponse : JsonResponse
{
    public List<RutasPlantas> RutasPlantas { get; set; }

    public static RutasPlantasListResponse GetResponse()
    {
        RutasPlantasListResponse r = new RutasPlantasListResponse();
        r.Status = 0;
        r.RutasPlantas = RutasPlantas.Get();
        return r;
    }
}
