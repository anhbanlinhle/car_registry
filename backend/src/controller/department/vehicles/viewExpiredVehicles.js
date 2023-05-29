import pool from "../../../configs/connectDB"

let viewExpiredVehicles = async (req, res) => {
  let resPerPage = parseInt(req.body.resPerPage)
  let page = parseInt(req.body.page)
  if (req.body.resPerPage === undefined)
    resPerPage = 10
  if (req.body.page === undefined)
    page = 1

  let count = `
  select count(*) as total from registry
  where (licenseId, expire) in
  (select v.licenseId as license, max(expire) as expire
  from vehicles v
  left join registry re
  on re.licenseId = v.licenseId
  group by v.licenseId)  
  and expire < current_date()`
  const [countRows, countFields] = await pool.query(count)
  
  let query = `
  select re.licenseId as license, v.brand, v.model, v.version, 
    re.date as registryDate, timestampdiff(month, re.date, re.expire) as duration, 
    p.name, (re.expire >= current_date()) as status
    from registry re
  join vehicles v 
    on v.licenseId = re.licenseId
  join owner o 
    on v.ownerId = o.id
  join personal p
    on p.id = o.id
  where (re.licenseId, expire) in
    (select v.licenseId as license, max(expire) as expire
      from vehicles v
    left join registry re
      on re.licenseId = v.licenseId
    group by re.licenseId)  
  and expire < current_date()
          union all 
  select re.licenseId as license, v.brand, v.model, v.version,
    re.date as registryDate, timestampdiff(month, re.date, re.expire) as duration, 
    c.name, (re.expire >= current_date()) as status
    from registry re
  join vehicles v 
    on v.licenseId = re.licenseId
  join owner o 
    on v.ownerId = o.id
  join company c 
    on c.id = o.id
  where (re.licenseId, expire) in
    (select v.licenseId as license, max(expire) as expire
      from vehicles v
    left join registry re
      on re.licenseId = v.licenseId
    group by re.licenseId)  
  and expire < current_date()
    order by license
    limit ? offset ?`

  const [rows, fields] = await pool.query(query, [resPerPage, 
                                                    resPerPage * (page - 1)])
  return res.send({data: rows, countData: countRows[0].total, 
                                          countPage: Math.ceil(countRows[0].total / resPerPage)})
}

module.exports = {
  viewExpiredVehicles
}