import { PrismaClient } from '@prisma/client';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import cors from 'cors';

const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

function generateRandomRA() {
  const uuid = uuidv4().substring(0, 6); // Gera um UUID de até 6 dígitos
  const ra = `00000${uuid}`;
  return ra;
}

app.post('/alunos', async (req, res) => {
  try {
    const { nome } = req.body;
    const ra = generateRandomRA();

    if (!nome) {
      return res.status(400).json({ error: 'O campo "nome" é obrigatório.' });
    }

    const aluno = await prisma.aluno.create({
      data: {
        ra,
        nome,
      },
    });

    res.json(aluno);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao criar o aluno.' });
  }
});

app.get('/alunos', async (req, res) => {
  const alunosComCurso = await prisma.$queryRaw`
    SELECT
      "Aluno".id AS "id",
      "Aluno".nome AS "nome",
      "Aluno".cursoId AS "curso.id",
      "Curso".nome AS "curso.nome"
    FROM "Aluno"
    LEFT JOIN "Curso" ON "Aluno"."cursoId" = "Curso"."id"
  `;
  res.json(alunosComCurso);
});

app.get('/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const aluno = await prisma.aluno.findUnique({
    where: {
      id: Number(id),
    },
  });
  res.json(aluno);
});

app.put('/alunos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, ra } = req.body;
  const aluno = await prisma.aluno.update({
    where: {
      id: Number(id),
    },
    data: {
      nome,
      ra,
    },
  });
  res.json(aluno);
});

app.delete('/alunos/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.aluno.delete({
    where: {
      id: Number(id),
    },
  });
  res.json({ message: 'Aluno deletado com sucesso' });
});


app.get('/materias', async (req, res) => {
  const materias = await prisma.materia.findMany();
  res.json(materias);
});


app.post('/materias', async (req, res) => {
  try {
    const { nome, cursoId, alunoId } = req.body;

    const curso = await prisma.curso.findUnique({
      where: {
        id: Number(cursoId),
      },
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado. A matéria só pode ser criada se estiver associada a um curso existente.' });
    }

    const aluno = await prisma.aluno.findUnique({
      where: {
        id: Number(alunoId),
      },
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado. A matéria só pode ser criada se estiver associada a um aluno existente.' });
    }

    const materia = await prisma.materia.create({
      data: {
        nome,
        cursoId: Number(cursoId),
        alunoId: Number(alunoId),
      },
    });

    res.json(materia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao criar a matéria.' });
  }
});

app.get('/materias/:id', async (req, res) => {
  const { id } = req.params;
  const materia = await prisma.materia.findUnique({
    where: {
      id: Number(id),
    },
  });
  res.json(materia);
});

app.put('/materias/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, alunoId, cursoId } = req.body;
  const materia = await prisma.materia.update({
    where: {
      id: Number(id),
    },
    data: {
      nome,
      alunoId: Number(alunoId),
      cursoId: Number(cursoId),
    },
  });
  res.json(materia);
});

app.delete('/materias/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.materia.delete({
    where: {
      id: Number(id),
    },
  });
  res.json({ message: 'Matéria deletada com sucesso' });
});

app.get('/cursos', async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        materias: true,
      },
    });

    res.json(cursos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao buscar os cursos.' });
  }
});


app.post('/cursos', async (req, res) => {
  const { nome, campoId } = req.body;
  const curso = await prisma.curso.create({
    data: {
      nome,
      campoId: Number(campoId),
    },
  });
  res.json(curso);
});

app.post('/cursos/:cursoId/adicionar-materias', async (req, res) => {
  try {
    const { cursoId } = req.params;
    const { materias } = req.body;

    const curso = await prisma.curso.findUnique({
      where: {
        id: Number(cursoId),
      },
    });

    if (!curso) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const materiasAssociadas = [];
    for (const materiaNome of materias) {
      const materia = await prisma.materia.create({
        data: {
          nome: materiaNome,
          cursoId: curso.id,
        },
      });
      materiasAssociadas.push(materia);
    }

    res.json({ message: 'Matérias adicionadas com sucesso ao curso.', materias: materiasAssociadas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao adicionar as matérias ao curso.' });
  }
});


app.get('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const curso = await prisma.curso.findUnique({
    where: {
      id: Number(id),
    },
  });
  res.json(curso);
});

app.put('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, campoId } = req.body;
  const curso = await prisma.curso.update({
    where: {
      id: Number(id),
    },
    data: {
      nome,
      campoId: Number(campoId),
    },
  });
  res.json(curso);
});

app.delete('/cursos/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.curso.delete({
    where: {
      id: Number(id),
    },
  });
  res.json({ message: 'Curso deletado com sucesso' });
});

app.get('/campos', async (req, res) => {
  const campos = await prisma.campo.findMany();
  res.json(campos);
});

app.post('/campos', async (req, res) => {
  const { nome } = req.body;
  const campo = await prisma.campo.create({
    data: {
      nome,
    },
  });
  res.json(campo);
});

app.get('/campos/:id', async (req, res) => {
  const { id } = req.params;
  const campo = await prisma.campo.findUnique({
    where: {
      id: Number(id),
    },
  });
  res.json(campo);
});

app.put('/campos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  const campo = await prisma.campo.update({
    where: {
      id: Number(id),
    },
    data: {
      nome,
    },
  });
  res.json(campo);
});

app.delete('/campos/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.campo.delete({
    where: {
      id: Number(id),
    },
  });
  res.json({ message: 'Campo deletado com sucesso' });
});

const corsOptions = {
  origin: 'http://localhost:3000',
};

app.use(cors(corsOptions));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
