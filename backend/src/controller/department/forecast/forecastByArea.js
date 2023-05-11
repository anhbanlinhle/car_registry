import pool from "../../../configs/connectDB";

let forecastByArea = async (req, res) => {
  let resPerPage = parseInt(req.body.resPerPage);
  let page = parseInt(req.body.page);
  if (req.body.resPerPage === undefined)
    resPerPage = 10
  if (req.body.page === undefined)
    page = 1

  let year = new Date().getFullYear();
  let month = new Date().getMonth() + 1;
  let match =
    `\nand year(expire) = ` +
    year +
    `\nand month(expire) = ` +
    month +
    `\nand expire >= CURRENT_DATE()` +
    `\nand re.name = '` + req.body.area + `'`;

  let count =
    `
  select count(*) as total
    from registry r
  join vehicles v
    on r.licenseId = v.licenseId
  join region re
    on v.regionId = re.id
  ` +
    match +
    `
  `;
  const [countRows, countFields] = await pool.query(count, [
    req.session.userid,
  ]);

  let query =
    `
  select r.licenseId, brand, model, version, max(expire) as expire, p.name as name
  from registry r
  join vehicles v 
    on r.licenseId = v.licenseId
  join personal p 
    on v.ownerId = p.id
  join region re
    on v.regionId = re.id
  join centre ce
    on ce.id = r.centreId` +
    match +
    `
  group by licenseId
        union all
  select r.licenseId, brand, model, version, max(expire) as expire, c.name as name
  from registry r
  join vehicles v 
    on r.licenseId = v.licenseId
  join company c 
    on v.ownerId = c.id
  join region re
    on v.regionId = re.id
  join centre ce
    on ce.id = r.centreId` +
    match +
    ` 
  group by licenseId
  order by licenseId asc
    limit ? offset ?`;

  // bug - đã gọi được api kết quả trả về chính xác
  const [rows, fields] = await pool.query(query, [
    resPerPage,
    resPerPage * (page - 1),
  ]);
  return res.send({
    data: rows,
    countData: countRows[0].total,
    countPage: Math.ceil(countRows[0].total / resPerPage),
  });
};

module.exports = {
  forecastByArea
};