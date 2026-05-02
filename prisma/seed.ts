import { PrismaClient, Role, Priority, SystemRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.task.deleteMany();
  await prisma.status.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@limelight.com",
      password: adminPassword,
      name: "Admin User",
      role: SystemRole.ADMIN,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
      role: SystemRole.USER,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@example.com",
      password: hashedPassword,
      name: "Jane Smith",
      role: SystemRole.USER,
    },
  });

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: "My First Project",
      key: "MFP",
      description: "A demo project to get started with JiraClone",
    },
  });

  // Add users to project
  await prisma.projectMember.create({
    data: {
      userId: admin.id,
      projectId: project.id,
      role: Role.ADMIN,
    },
  });

  await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: project.id,
      role: Role.ADMIN,
    },
  });

  await prisma.projectMember.create({
    data: {
      userId: user2.id,
      projectId: project.id,
      role: Role.MEMBER,
    },
  });

  // Create default statuses
  const todoStatus = await prisma.status.create({
    data: {
      name: "To Do",
      order: 0,
      projectId: project.id,
    },
  });

  const inProgressStatus = await prisma.status.create({
    data: {
      name: "In Progress",
      order: 1,
      projectId: project.id,
    },
  });

  const doneStatus = await prisma.status.create({
    data: {
      name: "Done",
      order: 2,
      projectId: project.id,
    },
  });

  // Create demo tasks
  await prisma.task.create({
    data: {
      title: "Set up project structure",
      description: "Initialize the project with all necessary folders and configurations",
      key: "MFP-1",
      priority: Priority.HIGH,
      order: 0,
      projectId: project.id,
      statusId: doneStatus.id,
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Design database schema",
      description: "Create the Prisma schema with all required models",
      key: "MFP-2",
      priority: Priority.HIGH,
      order: 1,
      projectId: project.id,
      statusId: doneStatus.id,
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Implement authentication",
      description: "Add login and registration functionality with JWT",
      key: "MFP-3",
      priority: Priority.URGENT,
      order: 0,
      projectId: project.id,
      statusId: inProgressStatus.id,
      creatorId: user.id,
      assigneeId: user.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Create Kanban board UI",
      description: "Build the drag-and-drop board interface",
      key: "MFP-4",
      priority: Priority.MEDIUM,
      order: 0,
      projectId: project.id,
      statusId: todoStatus.id,
      creatorId: user.id,
      assigneeId: user2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Add task filtering",
      description: "Implement filters for assignee, priority, and search",
      key: "MFP-5",
      priority: Priority.LOW,
      order: 1,
      projectId: project.id,
      statusId: todoStatus.id,
      creatorId: user.id,
    },
  });

  console.log("Seed data created successfully!");
  console.log("");
  console.log("Admin credentials:");
  console.log("  Email: admin@limelight.com");
  console.log("  Password: admin123");
  console.log("");
  console.log("Demo user credentials:");
  console.log("  Email: demo@example.com");
  console.log("  Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
