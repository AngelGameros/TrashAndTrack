[Route("api/[controller]")]
[ApiController]
public class TipoResiduosController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(TipoResiduoListResponse.GetResponse(TipoResiduo.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(TipoResiduoResponse.GetResponse(TipoResiduo.GetById(id)));
}
