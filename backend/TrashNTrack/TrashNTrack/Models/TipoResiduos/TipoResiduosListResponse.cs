using System.Collections.Generic;

public class TipoResiduosListResponse : JsonResponse
{
    public List<TipoResiduos> TiposResiduos { get; set; }

    public static TipoResiduosListResponse GetResponse()
    {
        TipoResiduosListResponse r = new TipoResiduosListResponse();
        r.Status = 0;
        r.TiposResiduos = TipoResiduos.Get();
        return r;
    }
}
