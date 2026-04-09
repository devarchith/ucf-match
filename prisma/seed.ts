import {
  MatchStatus,
  ParticipationStatus,
  PrismaClient,
  WeekStatus
} from "@prisma/client";

const prisma = new PrismaClient();

function seedIdentity() {
  const userId = process.env.SEED_USER_ID ?? process.env.DEV_AUTH_USER_ID ?? "dev-local-user";
  const ucfEmail =
    process.env.SEED_UCF_EMAIL ?? process.env.DEV_AUTH_UCF_EMAIL ?? "devlocal@ucf.edu";
  return { userId, ucfEmail };
}

function seedPeerIdentity() {
  const userId = process.env.SEED_PEER_USER_ID ?? "dev-peer-user";
  const ucfEmail = process.env.SEED_PEER_UCF_EMAIL ?? "peer@ucf.edu";
  return { userId, ucfEmail };
}

async function main() {
  const { userId, ucfEmail } = seedIdentity();

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      ucfEmail,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    },
    update: {
      ucfEmail,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: "Seed",
      lastName: "User",
      major: "Undeclared",
      graduationYear: new Date().getUTCFullYear() + 1,
      bio: "Local database seed for end-to-end testing."
    },
    update: {
      firstName: "Seed",
      lastName: "User"
    }
  });

  await prisma.questionnaireResponse.upsert({
    where: { userId },
    create: {
      userId,
      answers: {
        schedule: "Weekend afternoons",
        plans: "Coffee or a walk",
        topic: "Classes and projects"
      }
    },
    update: {
      answers: {
        schedule: "Weekend afternoons",
        plans: "Coffee or a walk",
        topic: "Classes and projects"
      }
    }
  });

  await prisma.preference.upsert({
    where: { userId },
    create: {
      userId,
      preferredGenders: ["any"],
      interests: ["coffee", "study-buddy"],
      communicationStyle: "text-first"
    },
    update: {
      preferredGenders: ["any"],
      interests: ["coffee", "study-buddy"],
      communicationStyle: "text-first"
    }
  });

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 1);
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() + 14);

  const week = await prisma.week.upsert({
    where: { label: "__seed_active_week__" },
    create: {
      label: "__seed_active_week__",
      startDate,
      endDate,
      status: WeekStatus.ACTIVE
    },
    update: {
      startDate,
      endDate,
      status: WeekStatus.ACTIVE
    }
  });

  await prisma.weeklyParticipation.upsert({
    where: {
      userId_weekId: {
        userId,
        weekId: week.id
      }
    },
    create: {
      userId,
      weekId: week.id,
      status: ParticipationStatus.OPTED_OUT
    },
    update: {}
  });

  const { userId: peerUserId, ucfEmail: peerUcfEmail } = seedPeerIdentity();

  await prisma.user.upsert({
    where: { id: peerUserId },
    create: {
      id: peerUserId,
      ucfEmail: peerUcfEmail,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    },
    update: {
      ucfEmail: peerUcfEmail,
      isEmailVerified: true,
      emailVerifiedAt: new Date()
    }
  });

  await prisma.profile.upsert({
    where: { userId: peerUserId },
    create: {
      userId: peerUserId,
      firstName: "Peer",
      lastName: "Seed",
      major: "Undeclared",
      graduationYear: new Date().getUTCFullYear() + 1,
      bio: "Second local user for report/block/match API checks."
    },
    update: {
      firstName: "Peer",
      lastName: "Seed"
    }
  });

  await prisma.questionnaireResponse.upsert({
    where: { userId: peerUserId },
    create: {
      userId: peerUserId,
      answers: {
        schedule: "Weekday evenings",
        plans: "Library",
        topic: "Research"
      }
    },
    update: {
      answers: {
        schedule: "Weekday evenings",
        plans: "Library",
        topic: "Research"
      }
    }
  });

  await prisma.preference.upsert({
    where: { userId: peerUserId },
    create: {
      userId: peerUserId,
      preferredGenders: ["any"],
      interests: ["coffee", "music"],
      communicationStyle: "in-person"
    },
    update: {
      preferredGenders: ["any"],
      interests: ["coffee", "music"],
      communicationStyle: "in-person"
    }
  });

  await prisma.weeklyParticipation.upsert({
    where: {
      userId_weekId: {
        userId: peerUserId,
        weekId: week.id
      }
    },
    create: {
      userId: peerUserId,
      weekId: week.id,
      status: ParticipationStatus.OPTED_OUT
    },
    update: {}
  });

  if (process.env.SEED_ACTIVE_MATCH === "true") {
    await prisma.match.deleteMany({
      where: {
        weekId: week.id,
        OR: [
          { participantA: { userId } },
          { participantB: { userId } },
          { participantA: { userId: peerUserId } },
          { participantB: { userId: peerUserId } }
        ]
      }
    });

    const now = new Date();
    const partPrimary = await prisma.weeklyParticipation.update({
      where: {
        userId_weekId: {
          userId,
          weekId: week.id
        }
      },
      data: {
        status: ParticipationStatus.MATCHED,
        optedInAt: now
      }
    });
    const partPeer = await prisma.weeklyParticipation.update({
      where: {
        userId_weekId: {
          userId: peerUserId,
          weekId: week.id
        }
      },
      data: {
        status: ParticipationStatus.MATCHED,
        optedInAt: now
      }
    });

    await prisma.match.create({
      data: {
        weekId: week.id,
        participantAId: partPrimary.id,
        participantBId: partPeer.id,
        status: MatchStatus.PENDING
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
