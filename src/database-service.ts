import { RegisteredUser } from './users-service';

export class DatabaseService {
    private firestore: FirebaseFirestore.Firestore
    private registeredUsersRef: FirebaseFirestore.CollectionReference<RegisteredUser>;

    constructor(firestore: FirebaseFirestore.Firestore) {
        this.firestore = firestore;
        this.registeredUsersRef = this.firestore.collection('registeredUsers') as FirebaseFirestore.CollectionReference<RegisteredUser>;
    }

    async retrieveAllRegisteredUsers() {
        const registeredUsersSnapshot = await this.registeredUsersRef.get();
        const registeredUsers: RegisteredUser[] = [];
        registeredUsersSnapshot.forEach((registeredUsersDoc) => {
            registeredUsers.push(registeredUsersDoc.data())
        });
        return registeredUsers;
    }

    async setRegisteredUser(registeredUser: RegisteredUser) {
        console.log(`DATABASE: New user registered`);
        await this.registeredUsersRef.doc(registeredUser.discordUserId).set(registeredUser);
    }

    async getRegisteredUser(discordUserId: string) {
        const registeredUserDoc = await this.registeredUsersRef.doc(discordUserId).get();
        if (!registeredUserDoc.exists) {
            throw new Error('UserNotExistsInDatabase')
        }

        return registeredUserDoc.data()
    }

    async deleteRegisteredUser(discordUserId: string) {
        console.log(`DATABASE: User deleted`);
        await this.registeredUsersRef.doc(discordUserId).delete();
    }
}