const mongoose = require('mongoose');
const Team = require('../models/team');

const teamController = {};

teamController.get = function (req, res) {
  const { teamId } = req.body;
  try {
    Team.findById(teamId, (err, team) => {
      if (err) {
        return res.status(409).json({ message: `Server error: ${err}` });
      }

      if (!team) {
        return res.status(409).json({ message: 'Team is not defined' });
      }

      res.status(200).json(team);
    });
  } catch (err) {
    res.status(500).json({ message: `Server error ${err}` });
  }
};

teamController.create = async function (req, res) {
  const { name, members } = req.body;

  try {
    const isCreated = await Team.findOne({ name });

    if (isCreated) {
      res.status(500).json({ message: `Team already exist` });
      return;
    }

    await Team.create({
      name,
      author: req.userId,
      members: [
        {
          userId: req.userId,
          role: ['author'],
        },
        ...members.filter((m) => m.userId.toString() !== req.userId),
      ],
      created_at: new Date(),
    });
    res.status(201).json({ message: `Team successfully created` });
  } catch (err) {
    res.status(500).json({ message: `Server error ${err}` });
  }
};

teamController.addMember = async function (req, res) {
  const { teamId, userId, role } = req.body;

  try {
    // rewrite with catch errors
    await Team.findByIdAndUpdate(
      { _id: teamId },
      {
        $push: {
          members: {
            userId,
            role,
          },
        },
      }
    );

    res.status(201).json({ message: 'Member was successfully added' });
  } catch (err) {
    res.status(500).json({ message: `Server error ${err}` });
  }
};

teamController.removeMember = function (req, res) {
  const { teamId, userId } = req.body;

  try {
    Team.findById(teamId, async (err, team) => {
      if (err) {
        return res.status(409).json({ message: `Server error: ${err}` });
      }

      if (!team) {
        return res.status(404).json({ message: 'Team is not defined' });
      }

      await team.update({
        $pull: {
          members: {
            userId,
          },
        },
      });

      res.status(200).json({ message: 'Member was successfully removed' });
    });
  } catch (err) {
    res.status(500).json({ message: `Server error ${err}` });
  }
};

teamController.changeRoles = function (req, res) {
  const { teamId, userId, role } = req.body;

  try {
    Team.findById(teamId, async (err, team) => {
      if (err) {
        return res.status(409).json({ message: `Server error: ${err}` });
      }

      if (!team) {
        return res.status(404).json({ message: 'Team is not defined' });
      }

      const index = team.members.findIndex((member) => member.userId.toString() === userId);

      if (index === -1) {
        res.status(404).json({ message: 'Member is not exist in team' });
        return;
      }

      team.members[index].role = role;
      await team.save();

      res.status(201).json({ message: 'Roles were successfully changed' });
    });
  } catch (err) {
    res.status(500).json({ message: `Server error ${err}` });
  }
};

teamController.delete = async (req, res) => {
  const { teamId } = req.body;

  try {
    await Team.findByIdAndRemove(teamId);
    res.status(200).json({ message: 'Team was successfully deleted' });
  } catch (err) {
    if (err.message.indexOf('Cast to ObjectId failed') !== -1) {
      return res.status(404).json({ message: 'Team is not defined' });
    }

    res.status(500).json({ message: `Server error: ${err}` });
  }

  try {
    Team.findById(teamId, (err, res) => {
      err
        ? res.status(404).json({ message: 'Team is not defined' })
        : res.status(500).json({ message: `Server error: ${err}` });
    });
  } catch (err) {
    res.status(500).json({ message: `Server error: ${err}` });
  }
};

module.exports = teamController;
