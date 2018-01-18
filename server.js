const express = require('express');
const app = express();
app.use(express.static('public'));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const errorhandler = require('errorhandler');
app.use(errorhandler());

const cors = require('cors');
app.use(cors());

const morgan = require('morgan');
app.use(morgan('dev'));

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// ============================= EMPLOYEE =============================
// /api/employees
app.get('/api/employees', (req, res, next) => {
  db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1', (err, rows) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({employees: rows});
    }
  });
});

app.post('/api/employees', (req, res, next) => {
  const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1;

  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
    VALUES ($name, $position, $wage, $isCurrentlyEmployed)`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentlyEmployed: is_current_employee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM Employee WHERE Employee.id = $id', {$id: this.lastID}, (error, employee) => {
        res.status(201).json({employee: employee});
      });
    }
  });
});

// /api/employees/:employeeId
app.get('/api/employees/:employeeId', (req, res, next) => {
  const id = req.params.employeeId;
  db.get('SELECT * FROM Employee WHERE Employee.id = $id', {$id: id}, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      res.status(200).json({employee: employee});
    } else {
      res.sendStatus(404);
    }
  });
});

app.put('/api/employees/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        is_current_employee = req.body.employee.is_current_employee === 0 ? 0 : 1;

  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Employee SET name = $name, position = $position,
    wage = $wage, is_current_employee = $is_current_employee WHERE Employee.id = $employeeId`;
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $is_current_employee: is_current_employee,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = $employeeId`, {$employeeId: req.params.employeeId}, (error, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
});

app.delete('/api/employees/:employeeId', (req, res, next) => {
  db.run(`UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = ${req.params.employeeId}`, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});

// /api/employees/:employeeId/timesheets
app.get('/api/employees/:employeeId/timesheets', (req, res, next) => {
  db.all(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      db.all(`SELECT * FROM Timesheet WHERE Timesheet.employee_id = ${req.params.employeeId}`, (err, rows) => {
        if (err) {
          next(err);
        } else if (rows) {
          res.status(200).json({timesheets: rows});
        } else {
          res.sendStatus(404);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });

});

app.post('/api/employees/:employeeId/timesheets', (req, res, next) => {
  const hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employee_id = req.params.employeeId;

  if (!hours || !rate || !date || !employee_id) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)';
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $employee_id: employee_id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $id', {$id: this.lastID}, (error, timesheet) => {
        res.status(201).json({timesheet: timesheet});
      });
    }
  });
});

// /api/employees/:employeeId/timesheets/:timesheetId
app.put('/api/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  const id = req.params.timesheetId,
    hours = req.body.timesheet.hours,
    rate = req.body.timesheet.rate,
    date = req.body.timesheet.date,
    employeeId = req.params.employeeId;

  if (!hours || !rate || !date || !employeeId || !id) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Timesheet SET hours = $hours, rate = $rate,
    date = $date WHERE Timesheet.id = $timesheetId`;
  const values = {
    $hours: hours,
    $rate: rate,
    $date: date,
    $timesheetId: id
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId', {$timesheetId: id}, (error, timesheet) => {
        res.status(200).json({timesheet: timesheet});
      });
    }
  });
});

app.delete('/api/employees/:employeeId/timesheets/:timesheetId', (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      db.run(`DELETE FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error) => {
        if (error) {
          next(error)
        } else {
          res.sendStatus(204);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// ============================= MENU =============================
// /api/menus
app.get('/api/menus', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({menus: menus});
    }
  });
});

app.post('/api/menus', (req, res, next) => {
  const title = req.body.menu.title;

  if (!title) {
    return res.sendStatus(400);
  }

  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  const values = {$title: title};

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM Menu WHERE Menu.id = $id', {$id: this.lastID}, (error, menu) => {
        res.status(201).json({menu: menu});
      });
    }
  });
});

// /api/menus/:menuId
app.get('/api/menus/:menuId', (req, res, next) => {
  const id = req.params.menuId;
  db.get('SELECT * FROM Menu WHERE Menu.id = $id', {$id: id}, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      res.status(200).json({menu: menu});
    } else {
      res.sendStatus(404);
    }
  });
});

app.put('/api/menus/:menuId', (req, res, next) => {
  const title = req.body.menu.title,
        id = req.params.menuId;

  if (!title || !id) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE Menu SET title = $title WHERE Menu.id = $id`;
  const values = {
    $title: title,
    $id: id
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = $id`, {$id: id}, (error, menu) => {
        res.status(200).json({menu: menu});
      });
    }
  });
});

app.delete('/api/menus/:menuId', (req, res, next) => {
  const id = req.params.menuId;

  if (!id) {
    return res.sendStatus(400);
  }

  db.all('SELECT * MenuItem WHERE MenuItem.menu_id = $menuId', {$menuId: id}, (error, menuItems) => {
    if (error) {
      next(error);
    } else if (menuItems) {
      res.sendStatus(400);
    } else {
      db.get('SELECT * Menu WHERE Menu.id = $menuId ', {$menuId: id}, (error, menu) => {
        if (error) {
          next(error);
        } else if (menu) {
          db.run('DELETE FROM Menu WHERE Menu.id = $menuId', {$menuId: id}, (error) => {
            if (error) {
              next(error)
            } else {
              res.sendStatus(204);
            }
          });
        } else {
          res.sendStatus(404);
        }
      });
    }
  });
});

// /api/menus/:menuId/menu-items
app.get('/api/menus/:menuId/menu-items', (req, res, next) => {
  db.all(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.params.menuId}`, (err, rows) => {
    if (err) {
      next(err);
    } else if (rows) {
      res.status(200).json({'menuItems': rows});
    } else {
      res.sendStatus(404);
    }
  });
});

app.post('/api/menus/:menuId/menu-items', (req, res, next) => {
  const name = req.body.menuItem.name,
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menu_id = req.params.menuId;

  if (!name || !description || !inventory || !price) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)';
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menu_id: menu_id
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $id', {$id: this.lastID}, (error, menuitem) => {
        res.status(201).json({menuItem: menuitem});
      });
    }
  });
});

// /api/menus/:menuId/menu-items/:menuItemId
app.put('/api/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
  const id = req.params.menuItemId
    name = req.body.menuItem.name,
    description = req.body.menuItem.description,
    inventory = req.body.menuItem.inventory,
    price = req.body.menuItem.price,
    menuId = req.params.menuId;

  if (!name || !description || !inventory || !price) {
    return res.sendStatus(400);
  }

  const sql = `UPDATE MenuItem SET name = $name, description = $description,
    inventory = $inventory, price = $price WHERE MenuItem.id = $menuItemId`;
  const values = {
    $name: name,
    $description: description,
    $inventory: inventory,
    $price: price,
    $menuItemId: id
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId', {$menuItemId: id}, (error, menuItem) => {
        res.status(200).json({menuItem: menuItem});
      });
    }
  });
});

app.delete('/api/menus/:menuId/menu-items/:menuItemId', (req, res, next) => {
  const id = req.params.menuItemId;
  db.get('SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId', {$menuItemId: id}, (error, menuItem) => {
    if (error) {
      next(error);
    } else if (menuItem) {
      db.run('DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId', {$menuItemId: id},  (error) => {
        if (error) {
          next(error)
        } else {
          res.sendStatus(204);
        }
      });
    } else {
      res.sendStatus(404);
    }
  });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
});

module.exports = app;
