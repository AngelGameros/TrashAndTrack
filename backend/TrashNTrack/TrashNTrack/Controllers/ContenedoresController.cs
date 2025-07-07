using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class ContenedoresController : ControllerBase
{
    [HttpGet]
    public ActionResult GetAll()
    {
        try
        {
            var contenedores = Contenedor.GetAll();
            return Ok(ContenedorListResponse.GetResponse(contenedores));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("{id}")]
    public ActionResult GetById(int id)
    {
        try
        {
            var contenedor = Contenedor.GetById(id);

            if (contenedor == null)
                return NotFound(new
                {
                    status = 1,
                    message = $"Contenedor con ID {id} no encontrado",
                    type = "error"
                });

            return Ok(ContenedorResponse.GetResponse(contenedor));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("por-empresa/{empresaId}")]
    public ActionResult GetByEmpresa(int empresaId)
    {
        try
        {
            var contenedores = Contenedor.GetByEmpresa(empresaId);
            return Ok(ContenedorListResponse.GetResponse(contenedores));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("por-tipo-residuo/{tipoResiduoId}")]
    public ActionResult GetByTipoResiduo(int tipoResiduoId)
    {
        try
        {
            var contenedores = Contenedor.GetByTipoResiduo(tipoResiduoId);
            return Ok(ContenedorListResponse.GetResponse(contenedores));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }

    [HttpGet("por-estado/{estado}")]
    public ActionResult GetByEstado(string estado)
    {
        try
        {
            var contenedores = Contenedor.GetByEstado(estado);
            return Ok(ContenedorListResponse.GetResponse(contenedores));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = 999,
                message = ex.Message,
                type = "error"
            });
        }
    }
}