const router = require('express').Router()

const { githubContributionData, gitlabContributionData } = require('../requests')

function appendContribution(contributions, contribution) {
    const index = contributions.findIndex(item => item.date === contribution.date)
    if (index !== -1) {
        contributions[index].count = contributions[index].count + contribution.count
    } else {
        contributions.push(contribution)
    }
}

router.get('/', async (req, res) => {
    const githubUsername = req.query.githubUsername
    const gitlabUsername = req.query.gitlabUsername

    /**
     * Example:
     * contributions: [
     *    {
     *       date: '2021-9-22',
     *       count: 5
     *    }
     * ]
     */
    let contributions = []

    const githubUsernames = githubUsername.split(',').map(name => name.trim())
    const gitlabUsernames = gitlabUsername.split(',').map(name => name.trim())

    for (const username of githubUsernames) {
        await githubContributionData(username).then(data => {
            data.forEach(element => {
                element.contributionDays.forEach(day => {
                    appendContribution(contributions, {
                        date: day.date,
                        count: day.contributionCount
                    })
                })
            });
        })
    }

    for (const username of gitlabUsernames) {

        let gitlabData = await gitlabContributionData(username).then(data => {
            return Object.entries(data).map(([key, value]) => ({date: key, count: value}))
        })

        contributions.forEach((element, index) => {
            const itemIndex = gitlabData.findIndex(item => item.date === element.date)

            if (itemIndex !== -1) {
                appendContribution(contributions, {
                    date: contributions[index].date,
                    count: contributions[index].count
                })
            }
        });
    }

    const totalContributionCount = contributions.reduce((accumulator, contribution) => {
        return accumulator + contribution.count;
    }, 0);

    res.json({
        data: {
            totalContributionCount,
            contributions,
        }
    }, 200)
})

module.exports = router