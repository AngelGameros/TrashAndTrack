[Route("api/[controller]")]
[ApiController]
public class RutasEmpresasController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(RutaEmpresaListResponse.GetResponse(RutaEmpresa.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(RutaEmpresaResponse.GetResponse(RutaEmpresa.GetById(id)));
}
