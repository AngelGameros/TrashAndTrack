using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class CamionesController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll() => Ok(CamionListResponse.GetResponse(Camion.GetAll()));

    [HttpGet("{id}")]
    public ActionResult GetById(int id) => Ok(CamionResponse.GetResponse(Camion.GetById(id)));
}
