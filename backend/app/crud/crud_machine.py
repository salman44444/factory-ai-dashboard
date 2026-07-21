from app.crud.base import CRUDBase
from app.models.machine import Machine
from app.schemas.machine import MachineCreate, MachineUpdate

class CRUDMachine(CRUDBase[Machine, MachineCreate, MachineUpdate]):
    pass

machine = CRUDMachine(Machine)
