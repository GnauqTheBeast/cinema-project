package datastore

import (
	"context"
	"fmt"
	"time"

	"migrate-cmd/models"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

func SeedRoles(ctx context.Context, db *bun.DB) error {
	roles := []*models.Role{
		{
			Id:          uuid.New().String(),
			Name:        "admin",
			Description: stringPtr("System administrator with full access"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "manager_staff",
			Description: stringPtr("Cinema manager staff"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "ticket_staff",
			Description: stringPtr("Cinema ticket staff"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "customer",
			Description: stringPtr("Regular customer"),
			CreatedAt:   time.Now(),
		},
	}

	_, err := db.NewInsert().Model(&roles).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed roles: %w", err)
	}

	fmt.Println("Roles seeded successfully!")
	return nil
}

func SeedPermissions(ctx context.Context, db *bun.DB) error {
	permissions := []*models.Permission{
		{
			Id:          uuid.New().String(),
			Name:        "Movie Manage",
			Code:        "movie_manage",
			Description: stringPtr("Manage movies (create, update, delete)"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Showtime Manage",
			Code:        "showtime_manage",
			Description: stringPtr("Manage movie showtimes"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Seat Manage",
			Code:        "seat_manage",
			Description: stringPtr("Manage cinema seats"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Report View",
			Code:        "report_view",
			Description: stringPtr("View analytics and operational reports"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Profile View",
			Code:        "profile_view",
			Description: stringPtr("View profile details"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Profile Update",
			Code:        "profile_update",
			Description: stringPtr("Update profile details"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Booking Create",
			Code:        "booking_create",
			Description: stringPtr("Create bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Booking Manage",
			Code:        "booking_manage",
			Description: stringPtr("Manage bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket Issue",
			Code:        "ticket_issue",
			Description: stringPtr("Issue or print tickets"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Payment Process",
			Code:        "payment_process",
			Description: stringPtr("Handle payments for bookings"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket View",
			Code:        "ticket_view",
			Description: stringPtr("View tickets"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "Staff Manage",
			Code:        "staff_manage",
			Description: stringPtr("Manage staff accounts"),
			CreatedAt:   time.Now(),
		},
		{
			Id:          uuid.New().String(),
			Name:        "News Manage",
			Code:        "news_manage",
			Description: stringPtr("Manage news articles and summaries"),
			CreatedAt:   time.Now(),
		},
	}

	_, err := db.NewInsert().Model(&permissions).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed permissions: %w", err)
	}

	fmt.Println("Permissions seeded successfully!")
	return nil
}

func SeedRolePermissions(ctx context.Context, db *bun.DB) error {
	var roles []models.Role
	if err := db.NewSelect().Model(&roles).Scan(ctx); err != nil {
		return fmt.Errorf("failed to get roles: %w", err)
	}

	var permissions []models.Permission
	if err := db.NewSelect().Model(&permissions).Scan(ctx); err != nil {
		return fmt.Errorf("failed to get permissions: %w", err)
	}

	if len(roles) == 0 || len(permissions) == 0 {
		return fmt.Errorf("roles or permissions missing; seed roles and permissions first")
	}

	roleNameToId := map[string]string{}
	for _, r := range roles {
		roleNameToId[r.Name] = r.Id
	}

	permCodeToId := map[string]string{}
	for _, p := range permissions {
		permCodeToId[p.Code] = p.Id
	}

	allCodes := []string{}
	for code := range permCodeToId {
		allCodes = append(allCodes, code)
	}

	managerStaffCodes := []string{
		"movie_manage",
		"showtime_manage",
		"seat_manage",
		"news_manage",
		"report_view",
		"profile_view",
		"profile_update",
	}

	ticketStaffCodes := []string{
		"booking_create",
		"booking_manage",
		"ticket_issue",
		"payment_process",
		"ticket_view",
		"profile_view",
		"profile_update",
	}

	customerCodes := []string{
		"booking_create",
		"booking_manage",
		"ticket_view",
		"profile_view",
		"profile_update",
	}

	var rolePerms []*models.RolePermission

	// Admin -> all permissions
	if adminId, ok := roleNameToId["admin"]; ok {
		for _, code := range allCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: adminId, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Manager staff
	if rid, ok := roleNameToId["manager_staff"]; ok {
		for _, code := range managerStaffCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Ticket staff
	if rid, ok := roleNameToId["ticket_staff"]; ok {
		for _, code := range ticketStaffCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	// Customer
	if rid, ok := roleNameToId["customer"]; ok {
		for _, code := range customerCodes {
			if pid, ok := permCodeToId[code]; ok {
				rolePerms = append(rolePerms, &models.RolePermission{Id: uuid.New().String(), RoleId: rid, PermissionId: pid, CreatedAt: time.Now()})
			}
		}
	}

	if len(rolePerms) == 0 {
		return fmt.Errorf("no role-permission mappings to insert; check roles/permissions")
	}

	if _, err := db.NewInsert().Model(&rolePerms).Exec(ctx); err != nil {
		return fmt.Errorf("failed to seed role_permissions: %w", err)
	}

	fmt.Println("Role permissions seeded successfully!")
	return nil
}

func SeedMovies(ctx context.Context, db *bun.DB) error {
	now := time.Now()
	releaseDate1 := time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC)
	releaseDate2 := time.Date(2024, 4, 20, 0, 0, 0, 0, time.UTC)
	releaseDate3 := time.Date(2024, 5, 10, 0, 0, 0, 0, time.UTC)
	releaseDate4 := time.Date(2025, 6, 15, 0, 0, 0, 0, time.UTC)

	movies := []*models.Movie{
		{
			Id:          uuid.New().String(),
			Title:       "Avengers: Endgame",
			Slug:        "avengers-endgame",
			Director:    "Anthony Russo, Joe Russo",
			Cast:        "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth",
			Genre:       "Action, Adventure, Drama",
			Duration:    181,
			ReleaseDate: &releaseDate1,
			Description: "After the devastating events of Avengers: Infinity War, the universe is in ruins due to the efforts of the Mad Titan, Thanos.",
			TrailerURL:  "https://www.youtube.com/watch?v=TcMBFSGVi1c",
			PosterURL:   "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
			Status:      "SHOWING",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Spider-Man: No Way Home",
			Slug:        "spider-man-no-way-home",
			Director:    "Jon Watts",
			Cast:        "Tom Holland, Zendaya, Benedict Cumberbatch, Jacob Batalon",
			Genre:       "Action, Adventure, Sci-Fi",
			Duration:    148,
			ReleaseDate: &releaseDate2,
			Description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.",
			TrailerURL:  "https://www.youtube.com/watch?v=JfVOs4VSpmA",
			PosterURL:   "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
			Status:      "SHOWING",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Top Gun: Maverick",
			Slug:        "top-gun-maverick",
			Director:    "Joseph Kosinski",
			Cast:        "Tom Cruise, Miles Teller, Jennifer Connelly, Jon Hamm",
			Genre:       "Action, Drama",
			Duration:    130,
			ReleaseDate: &releaseDate3,
			Description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission.",
			TrailerURL:  "https://www.youtube.com/watch?v=g4U4BQW9OEk",
			PosterURL:   "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
			Status:      "UPCOMING",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Dune",
			Slug:        "dune",
			Director:    "Denis Villeneuve",
			Cast:        "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac, Josh Brolin",
			Genre:       "Action, Adventure, Drama, Sci-Fi",
			Duration:    155,
			ReleaseDate: &releaseDate1,
			Description: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe.",
			TrailerURL:  "https://www.youtube.com/watch?v=8g18jFHCLXk",
			PosterURL:   "https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
			Status:      "SHOWING",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "The Batman",
			Slug:        "the-batman",
			Director:    "Matt Reeves",
			Cast:        "Robert Pattinson, Zoë Kravitz, Paul Dano, Jeffrey Wright",
			Genre:       "Action, Crime, Drama",
			Duration:    176,
			ReleaseDate: &releaseDate2,
			Description: "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
			TrailerURL:  "https://www.youtube.com/watch?v=mqqft2x_Aa4",
			PosterURL:   "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
			Status:      "SHOWING",
			CreatedAt:   &now,
		},
		{
			Id:          uuid.New().String(),
			Title:       "Zootopia",
			Slug:        "zootopia",
			Director:    "Byron Howard, Rich Moore",
			Cast:        "Ginnifer Goodwin, Jason Bateman, Idris Elba, Jenny Slate",
			Genre:       "Animation, Comedy, Adventure, Family",
			Duration:    108,
			ReleaseDate: &releaseDate4,
			Description: "In a city of anthropomorphic animals, a rookie bunny cop and a cynical con artist fox must work together to uncover a conspiracy.",
			TrailerURL:  "https://www.youtube.com/watch?v=jWM0ct-OLsM",
			PosterURL:   "https://artofthemovies.co.uk/cdn/shop/files/IMG_1521_1024x1024@2x.jpg?v=1762441851",
			Status:      "UPCOMING",
			CreatedAt:   &now,
		},
	}

	_, err := db.NewInsert().Model(&movies).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed movies: %w", err)
	}

	fmt.Println("Movies seeded successfully!")
	return nil
}

func SeedRooms(ctx context.Context, db *bun.DB) error {
	now := time.Now()
	rooms := []*models.Room{
		{
			Id:         uuid.New().String(),
			RoomNumber: 1,
			Capacity:   120,
			RoomType:   "STANDARD",
			Status:     "ACTIVE",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 2,
			Capacity:   150,
			RoomType:   "STANDARD",
			Status:     "ACTIVE",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 3,
			Capacity:   200,
			RoomType:   "IMAX",
			Status:     "ACTIVE",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 4,
			Capacity:   80,
			RoomType:   "VIP",
			Status:     "ACTIVE",
			CreatedAt:  now,
		},
		{
			Id:         uuid.New().String(),
			RoomNumber: 5,
			Capacity:   100,
			RoomType:   "STANDARD",
			Status:     "ACTIVE",
			CreatedAt:  now,
		},
	}

	_, err := db.NewInsert().Model(&rooms).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed rooms: %w", err)
	}

	fmt.Println("Rooms seeded successfully!")
	return nil
}

func SeedUsers(ctx context.Context, db *bun.DB) error {
	// Get role IDs first
	var roles []models.Role
	err := db.NewSelect().Model(&roles).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get roles: %w", err)
	}

	if len(roles) == 0 {
		return fmt.Errorf("no roles found, please seed roles first")
	}

	var adminRoleId, managerStaffRoleId, ticketStaffRoleId, customerRoleId string
	for _, role := range roles {
		switch role.Name {
		case "admin":
			adminRoleId = role.Id
		case "manager_staff":
			managerStaffRoleId = role.Id
		case "ticket_staff":
			ticketStaffRoleId = role.Id
		case "customer":
			customerRoleId = role.Id
		}
	}

	now := time.Now()
	users := []*models.User{
		{
			Id:          uuid.New().String(),
			Name:        "Admin User",
			Email:       "admin@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567890"),
			RoleId:      &adminRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Manager Staff",
			Email:       "manager@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567891"),
			RoleId:      &managerStaffRoleId,
			Address:     stringPtr("123 Manager Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Ticket Staff",
			Email:       "ticket@cinema.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567892"),
			RoleId:      &ticketStaffRoleId,
			Address:     stringPtr("123 Ticket Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Alice",
			Email:       "alice@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			Address:     stringPtr("123 Alice Street"),
			PhoneNumber: stringPtr("+1234567893"),
			RoleId:      &customerRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "female",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Bob",
			Email:       "bob@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567893"),
			Address:     stringPtr("123 Bob Street"),
			RoleId:      &customerRoleId,
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "male",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Emma Wilson",
			Email:       "emma@email.com",
			Password:    "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
			PhoneNumber: stringPtr("+1234567894"),
			RoleId:      &customerRoleId,
			Address:     stringPtr("123 Emma Street"),
			Dob:         time.Date(1990, 1, 1, 0, 0, 0, 0, time.UTC),
			Gender:      "female",
			Status:      "ACTIVE",
			CreatedAt:   now,
		},
	}

	_, err = db.NewInsert().Model(&users).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}

	fmt.Println("Users seeded successfully!")
	return nil
}

func SeedBookings(ctx context.Context, db *bun.DB) error {
	var users []models.User
	err := db.NewSelect().Model(&users).Limit(5).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}

	var showtimes []models.Showtime
	err = db.NewSelect().Model(&showtimes).Limit(5).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get showtimes: %w", err)
	}

	var seats []models.Seat
	err = db.NewSelect().Model(&seats).Limit(10).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get seats: %w", err)
	}

	bookings := []models.Booking{
		{
			Id:          uuid.New().String(),
			UserId:      users[3].Id,
			ShowtimeId:  showtimes[0].Id,
			TotalAmount: 200000,
			Status:      "CONFIRMED",
			CreatedAt:   time.Now().Add(-24 * time.Hour),
		},
		{
			Id:          uuid.New().String(),
			UserId:      users[3].Id,
			ShowtimeId:  showtimes[1].Id,
			TotalAmount: 100000,
			Status:      "CONFIRMED",
			CreatedAt:   time.Now().Add(-48 * time.Hour),
		},
		{
			Id:          uuid.New().String(),
			UserId:      users[3].Id,
			ShowtimeId:  showtimes[2].Id,
			TotalAmount: 300000,
			Status:      "PENDING",
			CreatedAt:   time.Now().Add(-72 * time.Hour),
		},
		{
			Id:          uuid.New().String(),
			UserId:      users[1].Id,
			ShowtimeId:  showtimes[0].Id,
			TotalAmount: 150000,
			Status:      "CONFIRMED",
			CreatedAt:   time.Now().Add(-96 * time.Hour),
		},
		{
			Id:          uuid.New().String(),
			UserId:      users[2].Id,
			ShowtimeId:  showtimes[1].Id,
			TotalAmount: 450000,
			Status:      "CANCELLED",
			CreatedAt:   time.Now().Add(-120 * time.Hour),
		},
	}

	_, err = db.NewInsert().Model(&bookings).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to insert bookings: %w", err)
	}

	return nil
}

func SeedTickets(ctx context.Context, db *bun.DB) error {
	var bookings []models.Booking
	err := db.NewSelect().Model(&bookings).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get bookings: %w", err)
	}

	var seats []models.Seat
	err = db.NewSelect().Model(&seats).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get seats: %w", err)
	}

	var showtimes []models.Showtime
	err = db.NewSelect().Model(&showtimes).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get seats: %w", err)
	}

	tickets := make([]models.Ticket, 0)
	for i := 0; i < len(bookings); i++ {
		tickets = append(tickets, models.Ticket{
			Id:         uuid.New().String(),
			BookingId:  bookings[i].Id,
			ShowtimeId: showtimes[i].Id,
			Status:     models.TicketStatusUsed,
			SeatId:     seats[i%len(seats)].Id,
			CreatedAt:  time.Now(),
		})
	}

	_, err = db.NewInsert().Model(&tickets).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to insert tickets: %w", err)
	}

	return nil
}

func SeedNotifications(ctx context.Context, db *bun.DB) error {
	var users []models.User
	err := db.NewSelect().Model(&users).Limit(3).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get users: %w", err)
	}

	if len(users) == 0 {
		return fmt.Errorf("no users found, please seed users first")
	}

	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)

	notifications := []*models.Notification{
		{
			Id:        uuid.New().String(),
			UserId:    users[0].Id,
			Title:     "Welcome to Cinema",
			Content:   "Thank you for joining our cinema! Enjoy your movie experience.",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[1].Id,
			Title:     "New Movie Release",
			Content:   "Spider-Man: No Way Home is now showing! Book your tickets now.",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[2].Id,
			Title:     "Special Offer",
			Content:   "Get 20% off on weekend bookings! Use code WEEKEND20",
			Status:    models.NotificationStatusSent,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[0].Id,
			Title:     "Booking Confirmation",
			Content:   "Your booking for Avengers: Endgame has been confirmed.",
			Status:    models.NotificationStatusRead,
			CreatedAt: &yesterday,
			UpdatedAt: &yesterday,
		},
		{
			Id:        uuid.New().String(),
			UserId:    users[1].Id,
			Title:     "System Maintenance",
			Content:   "System will be under maintenance on Sunday from 2 AM to 4 AM.",
			Status:    models.NotificationStatusPending,
			CreatedAt: &now,
			UpdatedAt: &now,
		},
	}

	_, err = db.NewInsert().Model(&notifications).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed notifications: %w", err)
	}

	fmt.Println("Notifications seeded successfully!")
	return nil
}

func stringPtr(s string) *string {
	return &s
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func SeedSeats(ctx context.Context, db *bun.DB) error {
	var rooms []models.Room
	err := db.NewSelect().Model(&rooms).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get rooms: %w", err)
	}

	if len(rooms) == 0 {
		return fmt.Errorf("no rooms found, please seed rooms first")
	}

	now := time.Now()
	var seats []*models.Seat

	seatConfigs := map[string]struct {
		rows        []string
		seatsPerRow int
		regularRows []string
		vipRows     []string
		coupleRows  []string
	}{
		"STANDARD": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"},
			seatsPerRow: 8,
			regularRows: []string{"A", "B", "C", "D", "E"},
			vipRows:     []string{"F", "G", "H", "I", "J", "K", "L"},
			coupleRows:  []string{},
		},
		"IMAX": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"},
			seatsPerRow: 14,
			regularRows: []string{"A", "B", "C", "D", "E"},
			vipRows:     []string{"F", "G", "H", "I", "J", "K", "L"},
			coupleRows:  []string{"M", "N", "O"},
		},
		"VIP": {
			rows:        []string{"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"},
			seatsPerRow: 8,
			regularRows: []string{"A", "B", "C"},
			vipRows:     []string{"D", "E", "F", "G", "H"},
			coupleRows:  []string{"I", "J"},
		},
	}

	for _, room := range rooms {
		config, exists := seatConfigs[room.RoomType]
		if !exists {
			continue
		}

		for _, row := range config.rows {
			seatsPerRow := config.seatsPerRow
			if contains(config.coupleRows, row) {
				seatsPerRow = 7
			}

			for seatNum := 1; seatNum <= seatsPerRow; seatNum++ {
				seatType := "REGULAR"

				for _, regularRow := range config.regularRows {
					if row == regularRow {
						seatType = "REGULAR"
						break
					}
				}

				for _, vipRow := range config.vipRows {
					if row == vipRow {
						seatType = "VIP"
						break
					}
				}

				for _, coupleRow := range config.coupleRows {
					if row == coupleRow {
						seatType = "COUPLE"
						break
					}
				}

				seat := &models.Seat{
					Id:         uuid.New().String(),
					RoomId:     room.Id,
					SeatNumber: fmt.Sprintf("%02d", seatNum),
					RowNumber:  row,
					SeatType:   seatType,
					Status:     "AVAILABLE",
					CreatedAt:  now,
				}
				seats = append(seats, seat)

				if seatType == "COUPLE" {
					seatNum++
					if seatNum <= seatsPerRow {
						coupleSeat := &models.Seat{
							Id:         uuid.New().String(),
							RoomId:     room.Id,
							SeatNumber: fmt.Sprintf("%02d", seatNum),
							RowNumber:  row,
							SeatType:   seatType,
							Status:     "AVAILABLE",
							CreatedAt:  now,
						}
						seats = append(seats, coupleSeat)
					}
				}
			}
		}
	}

	batchSize := 500
	for i := 0; i < len(seats); i += batchSize {
		end := i + batchSize
		if end > len(seats) {
			end = len(seats)
		}

		batch := seats[i:end]
		_, err = db.NewInsert().Model(&batch).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to seed seats batch %d-%d: %w", i, end, err)
		}
	}

	fmt.Printf("Seats seeded successfully! Total: %d seats\n", len(seats))
	return nil
}

func SeedShowtimes(ctx context.Context, db *bun.DB) error {
	var movies []models.Movie
	var rooms []models.Room

	err := db.NewSelect().Model(&movies).Where("status IN (?)", bun.In([]string{"SHOWING"})).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get movies: %w", err)
	}

	err = db.NewSelect().Model(&rooms).Where("status = ?", "ACTIVE").Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get rooms: %w", err)
	}

	if len(movies) == 0 {
		return fmt.Errorf("no movies found, please seed movies first")
	}

	if len(rooms) == 0 {
		return fmt.Errorf("no rooms found, please seed rooms first")
	}

	now := time.Now()
	var showtimes []*models.Showtime

	priceConfig := map[string]map[string]float64{
		"STANDARD": {
			"morning":   8000,
			"afternoon": 10000,
			"evening":   12000,
		},
		"VIP": {
			"morning":   15000,
			"afternoon": 18000,
			"evening":   22000,
		},
		"IMAX": {
			"morning":   12000,
			"afternoon": 15000,
			"evening":   18000,
		},
	}

	timeSlots := map[string][]string{
		"morning":   {"09:00", "11:30"},
		"afternoon": {"14:00", "16:30"},
		"evening":   {"19:00"},
	}

	for day := 0; day < 2; day++ {
		currentDate := now.AddDate(0, 0, day)

		for movieIdx, movie := range movies {
			if movie.ReleaseDate != nil && movie.ReleaseDate.After(now) {
				continue
			}

			for roomIdx, room := range rooms {
				// Determine which format to use for this movie+room combination
				// Ensure each time slot has only ONE format per movie per room per day
				formats := make([]string, 0)
				switch room.RoomType {
				case "IMAX":
					formats = []string{"2D", "3D", "IMAX"}
				case "STANDARD", "VIP":
					formats = []string{"2D", "3D"}
				}

				selectedFormat := formats[(movieIdx+roomIdx+day)%len(formats)]

				for period, times := range timeSlots {
					for _, timeStr := range times {
						startTime, err := time.Parse("15:04", timeStr)
						if err != nil {
							continue
						}

						showtimeStart := time.Date(
							currentDate.Year(), currentDate.Month(), currentDate.Day(),
							startTime.Hour(), startTime.Minute(), 0, 0, currentDate.Location(),
						)

						showtimeEnd := showtimeStart.Add(time.Duration(movie.Duration+30) * time.Minute)

						basePrice := priceConfig[room.RoomType][period]

						switch selectedFormat {
						case "3D":
							basePrice += 2000
						case "IMAX":
							basePrice += 5000
						}

						status := "SCHEDULED"
						if showtimeStart.Before(now) {
							if showtimeEnd.Before(now) {
								status = "COMPLETED"
							} else {
								status = "ONGOING"
							}
						}

						showtime := &models.Showtime{
							Id:        uuid.New().String(),
							MovieId:   movie.Id,
							RoomId:    room.Id,
							StartTime: showtimeStart,
							EndTime:   showtimeEnd,
							Format:    selectedFormat,
							BasePrice: basePrice,
							Status:    status,
							CreatedAt: now,
						}
						showtimes = append(showtimes, showtime)
					}
				}
			}
		}
	}

	batchSize := 100
	for i := 0; i < len(showtimes); i += batchSize {
		end := i + batchSize
		if end > len(showtimes) {
			end = len(showtimes)
		}

		batch := showtimes[i:end]
		_, err = db.NewInsert().Model(&batch).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to seed showtimes batch %d-%d: %w", i, end, err)
		}
	}

	fmt.Printf("Showtimes seeded successfully! Total: %d showtimes\n", len(showtimes))
	return nil
}

func SeedGenres(ctx context.Context, db *bun.DB) error {
	now := time.Now()
	genres := []*models.Genre{
		{
			Id:          uuid.New().String(),
			Name:        "Action",
			Slug:        "action",
			Description: stringPtr("Action-packed movies with intense sequences"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Adventure",
			Slug:        "adventure",
			Description: stringPtr("Exciting journeys and quests"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Comedy",
			Slug:        "comedy",
			Description: stringPtr("Light-hearted movies designed to make you laugh"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Drama",
			Slug:        "drama",
			Description: stringPtr("Serious, plot-driven movies"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Horror",
			Slug:        "horror",
			Description: stringPtr("Scary movies designed to frighten and thrill"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Romance",
			Slug:        "romance",
			Description: stringPtr("Love stories and romantic relationships"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Sci-Fi",
			Slug:        "sci-fi",
			Description: stringPtr("Science fiction and futuristic themes"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Thriller",
			Slug:        "thriller",
			Description: stringPtr("Suspenseful and intense storylines"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Fantasy",
			Slug:        "fantasy",
			Description: stringPtr("Magical and mythical worlds"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Animation",
			Slug:        "animation",
			Description: stringPtr("Animated movies for all ages"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Crime",
			Slug:        "crime",
			Description: stringPtr("Criminal activities and investigations"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Documentary",
			Slug:        "documentary",
			Description: stringPtr("Non-fiction films about real events"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Mystery",
			Slug:        "mystery",
			Description: stringPtr("Puzzling plots and detective stories"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "War",
			Slug:        "war",
			Description: stringPtr("Military conflicts and wartime stories"),
			CreatedAt:   now,
		},
		{
			Id:          uuid.New().String(),
			Name:        "Family",
			Slug:        "family",
			Description: stringPtr("Movies suitable for the whole family"),
			CreatedAt:   now,
		},
	}

	_, err := db.NewInsert().Model(&genres).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to seed genres: %w", err)
	}

	fmt.Println("Genres seeded successfully!")
	return nil
}

func SeedMovieGenres(ctx context.Context, db *bun.DB) error {
	// Get all movies and genres
	var movies []models.Movie
	err := db.NewSelect().Model(&movies).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get movies: %w", err)
	}

	var genres []models.Genre
	err = db.NewSelect().Model(&genres).Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to get genres: %w", err)
	}

	if len(movies) == 0 || len(genres) == 0 {
		return fmt.Errorf("movies or genres missing; seed movies and genres first")
	}

	genreNameToId := map[string]string{}
	for _, g := range genres {
		genreNameToId[g.Name] = g.Id
	}

	var movieGenres []*models.MovieGenre
	for _, movie := range movies {
		if movie.Genre == "" {
			continue
		}

		var genreNames []string
		switch movie.Genre {
		case "Action, Adventure, Drama":
			genreNames = []string{"Action", "Adventure", "Drama"}
		case "Action, Adventure, Sci-Fi":
			genreNames = []string{"Action", "Adventure", "Sci-Fi"}
		case "Action, Drama":
			genreNames = []string{"Action", "Drama"}
		case "Action, Adventure, Drama, Sci-Fi":
			genreNames = []string{"Action", "Adventure", "Drama", "Sci-Fi"}
		case "Action, Crime, Drama":
			genreNames = []string{"Action", "Crime", "Drama"}
		case "Animation, Comedy, Adventure, Family":
			genreNames = []string{"Animation", "Comedy", "Adventure", "Family"}
		default:
			genreNames = []string{"Drama"}
		}

		for _, genreName := range genreNames {
			if genreId, ok := genreNameToId[genreName]; ok {
				movieGenres = append(movieGenres, &models.MovieGenre{
					Id:        uuid.New().String(),
					MovieId:   movie.Id,
					GenreId:   genreId,
					CreatedAt: time.Now(),
				})
			}
		}
	}

	if len(movieGenres) > 0 {
		_, err = db.NewInsert().Model(&movieGenres).Exec(ctx)
		if err != nil {
			return fmt.Errorf("failed to seed movie_genres: %w", err)
		}
	}

	fmt.Printf("Movie-Genre relationships seeded successfully! Total: %d relationships\n", len(movieGenres))
	return nil
}
