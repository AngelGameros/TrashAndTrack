using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Data;
using Microsoft.Data.SqlClient;

public class Usuario
{
    #region statements
    private static String UsuarioGetAll = @"select id_usuario, primer_apell, segundo_apell, firebase_uid from usuarios";

    private static String UsuarioGetOne = @"
    select id_usuario, primer_apell, segundo_apell, firebase_uid from usuarios
    where id_usuario = @ID";
    #endregion

    #region attributes

    private int _id_usuario;
    private String _primer_apell;
    private String _segundo_apell;
    private int _firebase_uid;

    #endregion

    #region properties

    public int id_Usuario { get => _id_usuario; }
    public string primerApell { get => _primer_apell; set => _primer_apell = value; }
    public string secundoApell { get => _segundo_apell; set => _segundo_apell = value; }
    public int firebaseUid {  get => _firebase_uid; }


    #endregion

    #region Constructors

    public Usuario()
    {
        _id_usuario = 0;
        _primer_apell = "";
        _segundo_apell = "";
        _firebase_uid = 0;
    }
    public Usuario(int id_usuario, String primer_apell, String segundo_apell, int firebase_uid)
    {
        _id_usuario = id_usuario;
        _primer_apell = primer_apell;
        _segundo_apell = segundo_apell;
        _firebase_uid = firebase_uid;
    }

    #endregion

    #region classMethods

    public static List<Usuario> Get()
    {
        SqlCommand command = new SqlCommand(UsuarioGetAll);
        return UsuarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }



    public static Usuario Get(int id)
    {
        //sql command
        SqlCommand command = new SqlCommand(UsuarioGetOne);
        //paramaters
        command.Parameters.AddWithValue("@ID", id);
        //execute query 
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        //check if rows were found
        if (table.Rows.Count > 0)
            return UsuarioMapper.ToObject(table.Rows[0]);
        else
            throw new UsuarioNotFoundException(id);
    }

    #endregion
}