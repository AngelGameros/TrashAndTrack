[Route("api/[controller]")]
[ApiController]
public class CertificadosEmpresaController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(CertificadoEmpresaListResponse.GetResponse(CertificadoEmpresa.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(CertificadoEmpresaResponse.GetResponse(CertificadoEmpresa.GetById(id)));
}
