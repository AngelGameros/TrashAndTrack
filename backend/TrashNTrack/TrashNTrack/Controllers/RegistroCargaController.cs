[Route("api/[controller]")]
[ApiController]
public class RegistroCargaController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(RegistroCargaListResponse.GetResponse(RegistroCarga.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(RegistroCargaResponse.GetResponse(RegistroCarga.GetById(id)));
}
